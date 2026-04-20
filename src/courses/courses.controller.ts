import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { CoursesService } from './courses.service'
import { CreateCourseDto, UpdateCourseDto, CourseFiltersDto } from './dto/course.dto'
import { Public } from '../common/decorators/public.decorator'
import { Roles } from '../common/decorators/roles.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private courses: CoursesService) {}

  // ── Rutas públicas ─────────────────────────────────────────────────────────

  // GET /api/courses
  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar cursos publicados con filtros' })
  findAll(@Query() filters: CourseFiltersDto) {
    return this.courses.findAll(filters)
  }

  // GET /api/courses/featured
  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Cursos destacados (top por rating)' })
  findFeatured() {
    return this.courses.findFeatured()
  }

  // GET /api/courses/:slugOrId
  @Public()
  @Get(':slugOrId')
  @ApiOperation({ summary: 'Detalle de un curso por slug o ID' })
  findOne(@Param('slugOrId') slugOrId: string) {
    return this.courses.findBySlug(slugOrId)
  }

  // ── Rutas autenticadas ─────────────────────────────────────────────────────

  // GET /api/courses/manage/my  — instructor ve sus propios cursos
  @Get('manage/my')
  @Roles('instructor', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Instructor] Mis cursos' })
  findMyCourses(@CurrentUser() user: any) {
    return this.courses.findMyCoures(user.id)
  }

  // GET /api/courses/manage/:id — instructor/admin ve cualquier estado
  @Get('manage/:id')
  @Roles('instructor', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Instructor/Admin] Ver curso (incluyendo no publicados)' })
  findOneAdmin(@Param('id') id: string, @CurrentUser() user: any) {
    return this.courses.findByIdAdmin(id, user.id, user.role)
  }

  // POST /api/courses
  @Post()
  @Roles('instructor', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Instructor/Admin] Crear curso' })
  create(@Body() dto: CreateCourseDto, @CurrentUser() user: any) {
    return this.courses.create(dto, user.id)
  }

  // PATCH /api/courses/:id
  @Patch(':id')
  @Roles('instructor', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Instructor/Admin] Actualizar curso' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: any,
  ) {
    return this.courses.update(id, dto, user.id, user.role)
  }

  // PATCH /api/courses/:id/publish
  @Patch(':id/publish')
  @Roles('instructor', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Instructor/Admin] Publicar / despublicar curso' })
  togglePublish(@Param('id') id: string, @CurrentUser() user: any) {
    return this.courses.togglePublish(id, user.id, user.role)
  }

  // DELETE /api/courses/:id
  @Delete(':id')
  @Roles('instructor', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Instructor/Admin] Eliminar curso' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.courses.remove(id, user.id, user.role)
  }
}
