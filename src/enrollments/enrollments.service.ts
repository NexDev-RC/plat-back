import {
  Injectable, NotFoundException, ConflictException, ForbiddenException,
} from '@nestjs/common'
import { SupabaseService } from '../common/supabase/supabase.service'

@Injectable()
export class EnrollmentsService {
  constructor(private supabase: SupabaseService) {}

  // ── Mis inscripciones ──────────────────────────────────────────────────────

  async getMyEnrollments(userId: string) {
    const { data, error } = await this.supabase.admin
      .from('enrollments')
      .select(
        `id, progress, completed_lessons, last_watched_lesson_id, enrolled_at, completed_at,
         courses(
           id, title, slug, thumbnail_url, total_duration, total_lessons,
           categories(id, name, slug),
           users!courses_instructor_id_fkey(id, name)
         )`,
      )
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false })

    if (error) throw new Error(error.message)

    return data.map((e) => ({
      id: e.id,
      userId,
      courseId: (e.courses as any).id,
      course: e.courses,
      progress: e.progress,
      completedLessons: e.completed_lessons ?? [],
      lastWatchedLessonId: e.last_watched_lesson_id,
      enrolledAt: e.enrolled_at,
      completedAt: e.completed_at,
    }))
  }

  // ── Progreso de un curso específico ───────────────────────────────────────

  async getCourseProgress(userId: string, courseId: string) {
    const { data, error } = await this.supabase.admin
      .from('enrollments')
      .select('id, progress, completed_lessons, last_watched_lesson_id, enrolled_at, completed_at')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()

    if (error || !data) throw new NotFoundException('No estás inscrito en este curso')
    return data
  }

  // ── Inscribirse en un curso ────────────────────────────────────────────────

  async enroll(userId: string, courseId: string) {
    // Verificar que el curso existe y está publicado
    const { data: course, error: courseError } = await this.supabase.admin
      .from('courses')
      .select('id, title, is_published')
      .eq('id', courseId)
      .single()

    if (courseError || !course) throw new NotFoundException('Curso no encontrado')
    if (!course.is_published) throw new ForbiddenException('Este curso no está disponible')

    // Verificar que no esté ya inscrito
    const { data: existing } = await this.supabase.admin
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()

    if (existing) throw new ConflictException('Ya estás inscrito en este curso')

    const { data, error } = await this.supabase.admin
      .from('enrollments')
      .insert({ user_id: userId, course_id: courseId })
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Incrementar total_students del curso
    await this.supabase.admin.rpc('increment_course_students', { course_id: courseId })

    return data
  }

  // ── Marcar lección como completada ────────────────────────────────────────

  async completeLesson(userId: string, courseId: string, lessonId: string) {
    // Obtener el enrollment actual
    const { data: enrollment, error } = await this.supabase.admin
      .from('enrollments')
      .select('id, completed_lessons, course_id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()

    if (error || !enrollment) throw new NotFoundException('No estás inscrito en este curso')

    const completedLessons: string[] = enrollment.completed_lessons ?? []
    if (completedLessons.includes(lessonId)) {
      return { message: 'Lección ya estaba marcada como completada' }
    }

    const newCompleted = [...completedLessons, lessonId]

    // Calcular progreso: completadas / total lecciones del curso
    const { count: totalLessons } = await this.supabase.admin
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('sections.course_id', courseId)

    const progress = totalLessons
      ? Math.round((newCompleted.length / totalLessons) * 100)
      : 0

    const updateData: Record<string, any> = {
      completed_lessons: newCompleted,
      last_watched_lesson_id: lessonId,
      progress,
    }

    if (progress === 100) {
      updateData.completed_at = new Date().toISOString()
    }

    await this.supabase.admin
      .from('enrollments')
      .update(updateData)
      .eq('id', enrollment.id)

    return { progress, completedLessons: newCompleted }
  }
}
