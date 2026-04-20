import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { SupabaseService } from '../common/supabase/supabase.service'
import { CreateCourseDto, UpdateCourseDto, CourseFiltersDto } from './dto/course.dto'

@Injectable()
export class CoursesService {
  constructor(private supabase: SupabaseService) {}

  // ── Listar cursos con filtros y paginación ─────────────────────────────────

  async findAll(filters: CourseFiltersDto) {
    const {
      search, categoryId, level, minPrice, maxPrice,
      sortBy = 'newest', page = 1, limit = 12,
    } = filters

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = this.supabase.admin
      .from('courses')
      .select(
        `id, title, slug, short_description, thumbnail_url, price, discount_price,
         rating, total_reviews, total_students, total_duration, total_lessons,
         level, language, is_published, created_at,
         categories(id, name, slug),
         users!courses_instructor_id_fkey(id, name, avatar_url)`,
        { count: 'exact' },
      )
      .eq('is_published', true)

    // Filtros
    if (search) {
      query = query.ilike('title', `%${search}%`)
    }
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }
    if (level) {
      query = query.eq('level', level)
    }
    if (minPrice !== undefined) {
      query = query.gte('price', minPrice)
    }
    if (maxPrice !== undefined) {
      query = query.lte('price', maxPrice)
    }

    // Ordenamiento
    switch (sortBy) {
      case 'popular':
        query = query.order('total_students', { ascending: false })
        break
      case 'rating':
        query = query.order('rating', { ascending: false })
        break
      case 'price-asc':
        query = query.order('price', { ascending: true })
        break
      case 'price-desc':
        query = query.order('price', { ascending: false })
        break
      default: // newest
        query = query.order('created_at', { ascending: false })
    }

    const { data, error, count } = await query.range(from, to)

    if (error) throw new BadRequestException(error.message)

    return {
      data: data.map(this.formatCourseList),
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    }
  }

  // ── Cursos destacados (top 8 por rating) ──────────────────────────────────

  async findFeatured() {
    const { data, error } = await this.supabase.admin
      .from('courses')
      .select(
        `id, title, slug, short_description, thumbnail_url, price, discount_price,
         rating, total_reviews, total_students, total_duration, total_lessons,
         level, language, created_at,
         categories(id, name, slug),
         users!courses_instructor_id_fkey(id, name, avatar_url)`,
      )
      .eq('is_published', true)
      .order('rating', { ascending: false })
      .limit(8)

    if (error) throw new BadRequestException(error.message)
    return data.map(this.formatCourseList)
  }

  // ── Obtener curso por slug o ID (con secciones y lecciones) ───────────────

  async findBySlug(slugOrId: string) {
    const { data, error } = await this.supabase.admin
      .from('courses')
      .select(
        `id, title, slug, description, short_description, thumbnail_url, preview_video_url,
         price, discount_price, rating, total_reviews, total_students,
         total_duration, total_lessons, level, language, tags, is_published,
         created_at, updated_at,
         categories(id, name, slug),
         users!courses_instructor_id_fkey(id, name, avatar_url, bio),
         sections(
           id, title, order,
           lessons(id, title, description, video_url, duration, order, is_free)
         )`,
      )
      .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
      .eq('is_published', true)
      .single()

    if (error || !data) throw new NotFoundException('Curso no encontrado')

    return this.formatCourseDetail(data)
  }

  // ── Obtener curso para el instructor/admin (incluyendo no publicados) ──────

  async findByIdAdmin(id: string, userId: string, userRole: string) {
    const { data, error } = await this.supabase.admin
      .from('courses')
      .select(
        `id, title, slug, description, short_description, thumbnail_url, preview_video_url,
         price, discount_price, rating, total_reviews, total_students,
         total_duration, total_lessons, level, language, tags, is_published,
         instructor_id, created_at, updated_at,
         categories(id, name, slug),
         users!courses_instructor_id_fkey(id, name, avatar_url, bio),
         sections(
           id, title, order,
           lessons(id, title, description, video_url, duration, order, is_free)
         )`,
      )
      .eq('id', id)
      .single()

    if (error || !data) throw new NotFoundException('Curso no encontrado')

    // El instructor solo puede ver sus propios cursos no publicados
    if (userRole === 'instructor' && data.instructor_id !== userId) {
      throw new ForbiddenException('No tienes acceso a este curso')
    }

    return this.formatCourseDetail(data)
  }

  // ── Mis cursos (instructor) ────────────────────────────────────────────────

  async findMyCoures(instructorId: string) {
    const { data, error } = await this.supabase.admin
      .from('courses')
      .select(
        `id, title, slug, thumbnail_url, price, rating, total_students,
         is_published, created_at,
         categories(id, name, slug)`,
      )
      .eq('instructor_id', instructorId)
      .order('created_at', { ascending: false })

    if (error) throw new BadRequestException(error.message)
    return data
  }

  // ── Crear curso ────────────────────────────────────────────────────────────

  async create(dto: CreateCourseDto, instructorId: string) {
    const slugify = (await import('slugify')).default
    const baseSlug = slugify(dto.title, { lower: true, strict: true })
    const slug = `${baseSlug}-${Date.now()}`

    // 1. Calcular totales desde las secciones
    const totalLessons = dto.sections?.reduce(
      (sum, s) => sum + (s.lessons?.length ?? 0), 0,
    ) ?? 0
    const totalDuration = dto.sections?.reduce(
      (sum, s) => sum + (s.lessons?.reduce((ls, l) => ls + l.duration, 0) ?? 0), 0,
    ) ?? 0

    // 2. Insertar el curso
    const { data: course, error: courseError } = await this.supabase.admin
      .from('courses')
      .insert({
        title: dto.title,
        slug,
        description: dto.description,
        short_description: dto.shortDescription,
        thumbnail_url: dto.thumbnailUrl ?? null,
        preview_video_url: dto.previewVideoUrl ?? null,
        price: dto.price,
        discount_price: dto.discountPrice ?? null,
        level: dto.level,
        language: dto.language,
        category_id: dto.categoryId,
        instructor_id: instructorId,
        tags: dto.tags ?? [],
        total_lessons: totalLessons,
        total_duration: totalDuration,
        is_published: false,
      })
      .select('id')
      .single()

    if (courseError) throw new BadRequestException(courseError.message)

    // 3. Insertar secciones y lecciones si se proveyeron
    if (dto.sections?.length) {
      await this.upsertSections(course.id, dto.sections)
    }

    return this.findByIdAdmin(course.id, instructorId, 'instructor')
  }

  // ── Actualizar curso ───────────────────────────────────────────────────────

  async update(id: string, dto: UpdateCourseDto, userId: string, userRole: string) {
    // Verificar propiedad
    await this.findByIdAdmin(id, userId, userRole)

    const updateData: Record<string, any> = {}
    if (dto.title !== undefined) updateData.title = dto.title
    if (dto.description !== undefined) updateData.description = dto.description
    if (dto.shortDescription !== undefined) updateData.short_description = dto.shortDescription
    if (dto.thumbnailUrl !== undefined) updateData.thumbnail_url = dto.thumbnailUrl
    if (dto.previewVideoUrl !== undefined) updateData.preview_video_url = dto.previewVideoUrl
    if (dto.price !== undefined) updateData.price = dto.price
    if (dto.discountPrice !== undefined) updateData.discount_price = dto.discountPrice
    if (dto.level !== undefined) updateData.level = dto.level
    if (dto.language !== undefined) updateData.language = dto.language
    if (dto.categoryId !== undefined) updateData.category_id = dto.categoryId
    if (dto.tags !== undefined) updateData.tags = dto.tags
    if (dto.isPublished !== undefined) updateData.is_published = dto.isPublished

    updateData.updated_at = new Date().toISOString()

    const { error } = await this.supabase.admin
      .from('courses')
      .update(updateData)
      .eq('id', id)

    if (error) throw new BadRequestException(error.message)

    // Actualizar secciones si se enviaron
    if (dto.sections?.length) {
      // Recalcular totales
      const totalLessons = dto.sections.reduce(
        (sum, s) => sum + (s.lessons?.length ?? 0), 0,
      )
      const totalDuration = dto.sections.reduce(
        (sum, s) => sum + (s.lessons?.reduce((ls, l) => ls + l.duration, 0) ?? 0), 0,
      )
      await this.supabase.admin
        .from('courses')
        .update({ total_lessons: totalLessons, total_duration: totalDuration })
        .eq('id', id)

      await this.upsertSections(id, dto.sections)
    }

    return this.findByIdAdmin(id, userId, userRole)
  }

  // ── Publicar / despublicar ─────────────────────────────────────────────────

  async togglePublish(id: string, userId: string, userRole: string) {
    const course = await this.findByIdAdmin(id, userId, userRole)

    const { error } = await this.supabase.admin
      .from('courses')
      .update({ is_published: !course.isPublished, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw new BadRequestException(error.message)

    return { isPublished: !course.isPublished }
  }

  // ── Eliminar curso ─────────────────────────────────────────────────────────

  async remove(id: string, userId: string, userRole: string) {
    await this.findByIdAdmin(id, userId, userRole)

    const { error } = await this.supabase.admin
      .from('courses')
      .delete()
      .eq('id', id)

    if (error) throw new BadRequestException(error.message)

    return { message: 'Curso eliminado correctamente' }
  }

  // ── Helpers privados ───────────────────────────────────────────────────────

  private async upsertSections(courseId: string, sections: any[]) {
    // Eliminar secciones anteriores (cascade borra lecciones)
    await this.supabase.admin
      .from('sections')
      .delete()
      .eq('course_id', courseId)

    for (const section of sections) {
      const { data: sec } = await this.supabase.admin
        .from('sections')
        .insert({ course_id: courseId, title: section.title, order: section.order })
        .select('id')
        .single()

      if (sec && section.lessons?.length) {
        await this.supabase.admin.from('lessons').insert(
          section.lessons.map((l: any) => ({
            section_id: sec.id,
            title: l.title,
            description: l.description ?? null,
            video_url: l.videoUrl ?? null,
            duration: l.duration,
            order: l.order,
            is_free: l.isFree ?? false,
          })),
        )
      }
    }
  }

  private formatCourseList(c: any) {
    return {
      id: c.id,
      title: c.title,
      slug: c.slug,
      shortDescription: c.short_description,
      thumbnailUrl: c.thumbnail_url,
      price: c.price,
      discountPrice: c.discount_price,
      rating: c.rating,
      totalReviews: c.total_reviews,
      totalStudents: c.total_students,
      totalDuration: c.total_duration,
      totalLessons: c.total_lessons,
      level: c.level,
      language: c.language,
      category: c.categories,
      instructor: c.users
        ? { id: c.users.id, name: c.users.name, avatarUrl: c.users.avatar_url }
        : null,
      createdAt: c.created_at,
    }
  }

  private formatCourseDetail(c: any) {
    const sections = (c.sections ?? [])
      .sort((a: any, b: any) => a.order - b.order)
      .map((s: any) => ({
        id: s.id,
        title: s.title,
        order: s.order,
        lessons: (s.lessons ?? [])
          .sort((a: any, b: any) => a.order - b.order)
          .map((l: any) => ({
            id: l.id,
            title: l.title,
            description: l.description,
            videoUrl: l.video_url,
            duration: l.duration,
            order: l.order,
            isFree: l.is_free,
          })),
      }))

    return {
      id: c.id,
      title: c.title,
      slug: c.slug,
      description: c.description,
      shortDescription: c.short_description,
      thumbnailUrl: c.thumbnail_url,
      previewVideoUrl: c.preview_video_url,
      price: c.price,
      discountPrice: c.discount_price,
      rating: c.rating,
      totalReviews: c.total_reviews,
      totalStudents: c.total_students,
      totalDuration: c.total_duration,
      totalLessons: c.total_lessons,
      level: c.level,
      language: c.language,
      tags: c.tags ?? [],
      isPublished: c.is_published,
      category: c.categories,
      instructor: c.users
        ? { id: c.users.id, name: c.users.name, avatarUrl: c.users.avatar_url, bio: c.users.bio }
        : null,
      sections,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }
  }
}
