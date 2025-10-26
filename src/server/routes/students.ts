import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { HonoEnv } from '@shared/types/env'
import { createDjangoDataClient } from '../services/django-data'

/**
 * Students Routes
 *
 * Manages student (alumno) data via Django REST API
 * All endpoints require authentication and auto-filter by clinica_id
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
  edad: z.number().int().min(0).max(120),
  curso: z.string().min(1).max(50),
  genero: z.enum(['M', 'F', 'O']).optional(),
})

const updateStudentSchema = createStudentSchema.partial()

const listQuerySchema = z.object({
  search: z.string().optional(),
  institucion_id: z.string().uuid().optional(),
  curso: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional(),
  page_size: z.string().regex(/^\d+$/).optional(),
})

// ==================== ROUTES ====================

/**
 * GET /api/students
 * List students with filtering and pagination
 */
app.get('/', zValidator('query', listQuerySchema), async (c) => {
  const accessToken = c.get('accessToken')
  const query = c.req.valid('query')

  const djangoData = createDjangoDataClient(c.env)

  const response = await djangoData.getStudents(accessToken, {
    search: query.search,
    institucion_id: query.institucion_id,
    curso: query.curso,
    page: query.page ? parseInt(query.page) : undefined,
    page_size: query.page_size ? parseInt(query.page_size) : undefined,
  })

  return c.json({
    data: response.results,
    count: response.count,
    next: response.next,
    previous: response.previous,
  })
})

/**
 * GET /api/students/:id
 * Get a single student by ID
 */
app.get('/:id', async (c) => {
  const accessToken = c.get('accessToken')
  const studentId = c.req.param('id')

  const djangoData = createDjangoDataClient(c.env)

  const student = await djangoData.getStudent(studentId, accessToken)

  return c.json(student)
})

/**
 * POST /api/students
 * Create a new student
 */
app.post('/', zValidator('json', createStudentSchema), async (c) => {
  const accessToken = c.get('accessToken')
  const clinicaId = c.get('clinicaId')
  const studentData = c.req.valid('json')

  const djangoData = createDjangoDataClient(c.env)

  // Django API will validate institution ownership
  // We add clinica_id for denormalized querying (performance)
  const newStudent = await djangoData.createStudent(
    {
      ...studentData,
      clinica_id: clinicaId,
    },
    accessToken
  )

  return c.json(newStudent, 201)
})

/**
 * PATCH /api/students/:id
 * Update a student
 */
app.patch('/:id', zValidator('json', updateStudentSchema), async (c) => {
  const accessToken = c.get('accessToken')
  const studentId = c.req.param('id')
  const updates = c.req.valid('json')

  const djangoData = createDjangoDataClient(c.env)

  // Django API will verify ownership before updating
  const updatedStudent = await djangoData.updateStudent(
    studentId,
    updates,
    accessToken
  )

  return c.json(updatedStudent)
})

/**
 * DELETE /api/students/:id
 * Soft delete a student
 */
app.delete('/:id', async (c) => {
  const accessToken = c.get('accessToken')
  const studentId = c.req.param('id')

  const djangoData = createDjangoDataClient(c.env)

  // Django API performs soft delete and ownership verification
  await djangoData.deleteStudent(studentId, accessToken)

  return c.json({ message: 'Student deleted successfully' })
})

export { app as studentRoutes }
