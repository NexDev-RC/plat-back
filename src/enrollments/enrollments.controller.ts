import { Controller, Get, Post, Param, Body } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { IsUUID, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { EnrollmentsService } from './enrollments.service'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { Roles } from '../common/decorators/roles.decorator'

class EnrollDto {
  @ApiProperty()
  @IsUUID()
  courseId: string
}

class CompleteLessonDto {
  @ApiProperty()
  @IsString()
  lessonId: string
}

@ApiTags('Enrollments')
@ApiBearerAuth()
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private enrollments: EnrollmentsService) {}

  // GET /api/enrollments/me
  @Get('me')
  @Roles('student', 'admin')
  @ApiOperation({ summary: 'Mis cursos inscritos con progreso' })
  getMyEnrollments(@CurrentUser() user: any) {
    return this.enrollments.getMyEnrollments(user.id)
  }

  // GET /api/enrollments/:courseId
  @Get(':courseId')
  @Roles('student', 'admin')
  @ApiOperation({ summary: 'Progreso en un curso específico' })
  getCourseProgress(@Param('courseId') courseId: string, @CurrentUser() user: any) {
    return this.enrollments.getCourseProgress(user.id, courseId)
  }

  // POST /api/enrollments
  @Post()
  @Roles('student', 'admin')
  @ApiOperation({ summary: 'Inscribirse en un curso' })
  enroll(@Body() dto: EnrollDto, @CurrentUser() user: any) {
    return this.enrollments.enroll(user.id, dto.courseId)
  }

  // POST /api/enrollments/:courseId/complete-lesson
  @Post(':courseId/complete-lesson')
  @Roles('student', 'admin')
  @ApiOperation({ summary: 'Marcar lección como completada' })
  completeLesson(
    @Param('courseId') courseId: string,
    @Body() dto: CompleteLessonDto,
    @CurrentUser() user: any,
  ) {
    return this.enrollments.completeLesson(user.id, courseId, dto.lessonId)
  }
}
