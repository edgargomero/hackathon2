import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { HonoEnv } from '@shared/types/env'
import {
  createSupabaseClient,
  getStudents,
  getStudentById,
} from '../services/supabase'

/**
 * Students Routes
 *
 * Manages student (alumno) data via Supabase
 */
const app = new Hono<HonoEnv>()

// ==================== VALIDATION SCHEMAS ====================

const createStudentSchema = z.object({
  institucion_id: z.string().uuid(),
  rut: z.string().min(9).max(12),
  nombre: z.string().min(1).max(255),
  apellido_paterno: z.string().min(1).max(255),
  apellido_materno: z.string().max(255).optional(),
  fecha_nacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  edad: z.number().int().min(0).max(100),
  curso: z.string().min(1).max(50),
  genero: z.enum(['M', 'F', 'O']).optional(),
})

const updateStudentSchema = createStudentSchema.partial()

const listQuerySchema = z.object({
  search: z.string().optional(),
  institucion_id: z.string().uuid().optional(),
  curso: z.string().optional(),
  activo: z.enum(['true', 'false']).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  offset: z.string().regex(/^\d+$/).optional(),
})

// ==================== ROUTES ====================

/**
 * GET /api/students
 * List students with filtering and pagination
 */
app.get('/', zValidator('query', listQuerySchema), async (c) => {
  const clinicaId = c.get('clinicaId')
  const query = c.req.valid('query')

  const supabase = createSupabaseClient(c.env)

  const { data, count } = await getStudents(supabase, clinicaId, {
    search: query.search,
    institucionId: query.institucion_id,
    curso: query.curso,
    activo: query.activo === 'true' ? true : query.activo === 'false' ? false : undefined,
    limit: query.limit ? parseInt(query.limit) : undefined,
    offset: query.offset ? parseInt(query.offset) : undefined,
  })

  return c.json({
    data,
    count,
    limit: query.limit ? parseInt(query.limit) : 50,
    offset: query.offset ? parseInt(query.offset) : 0,
  })
})

/**
 * GET /api/students/:id
 * Get a single student by ID
 */
app.get('/:id', async (c) => {
  const clinicaId = c.get('clinicaId')
  const studentId = c.req.param('id')

  const supabase = createSupabaseClient(c.env)

  try {
    const student = await getStudentById(supabase, studentId, clinicaId)
    return c.json(student)
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return c.json({ error: 'Student not found or access denied' }, 404)
    }
    throw error
  }
})

/**
 * POST /api/students
 * Create a new student
 */
app.post('/', zValidator('json', createStudentSchema), async (c) => {
  const clinicaId = c.get('clinicaId')
  const studentData = c.req.valid('json')

  const supabase = createSupabaseClient(c.env)

  // Verify institution belongs to user's clinic
  const { data: institution } = await supabase
    .from('institucion')
    .select('clinica_id')
    .eq('id', studentData.institucion_id)
    .single()

  if (!institution || institution.clinica_id !== clinicaId) {
    return c.json({ error: 'Institution not found or access denied' }, 403)
  }

  // Note: We're also setting clinica_id directly for easier querying
  // This is denormalized but improves query performance
  const { data, error } = await supabase
    .from('alumno')
    .insert({
      clinica_id: clinicaId,
      ...studentData,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') { // Unique violation
      return c.json({ error: 'Student with this RUT already exists' }, 409)
    }
    throw error
  }

  return c.json(data, 201)
})

/**
 * PATCH /api/students/:id
 * Update a student
 */
app.patch('/:id', zValidator('json', updateStudentSchema), async (c) => {
  const clinicaId = c.get('clinicaId')
  const studentId = c.req.param('id')
  const updates = c.req.valid('json')

  const supabase = createSupabaseClient(c.env)

  // Verify ownership first
  try {
    await getStudentById(supabase, studentId, clinicaId)
  } catch {
    return c.json({ error: 'Student not found or access denied' }, 404)
  }

  // Perform update
  const { data, error } = await supabase
    .from('alumno')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', studentId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return c.json(data)
})

/**
 * DELETE /api/students/:id
 * Soft delete a student
 */
app.delete('/:id', async (c) => {
  const clinicaId = c.get('clinicaId')
  const studentId = c.req.param('id')

  const supabase = createSupabaseClient(c.env)

  // Verify ownership first
  try {
    await getStudentById(supabase, studentId, clinicaId)
  } catch {
    return c.json({ error: 'Student not found or access denied' }, 404)
  }

  // Soft delete
  const { error } = await supabase
    .from('alumno')
    .update({
      activo: false,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', studentId)

  if (error) {
    throw error
  }

  return c.json({ message: 'Student deleted successfully' })
})

export { app as studentRoutes }
