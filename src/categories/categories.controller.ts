import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { CategoriesService, CreateCategoryDto } from './categories.service'
import { Public } from '../common/decorators/public.decorator'
import { Roles } from '../common/decorators/roles.decorator'

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private categories: CategoriesService) {}

  // GET /api/categories — público
  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar todas las categorías' })
  findAll() {
    return this.categories.findAll()
  }

  // POST /api/categories — solo admin
  @Post()
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Crear categoría' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categories.create(dto)
  }

  // DELETE /api/categories/:id — solo admin
  @Delete(':id')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Eliminar categoría' })
  remove(@Param('id') id: string) {
    return this.categories.remove(id)
  }
}
