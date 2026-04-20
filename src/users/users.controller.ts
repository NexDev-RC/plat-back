import {
  Controller, Get, Patch, Delete, Body, Param, Query,
  ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { UsersService } from './users.service'
import { UpdateUserDto, UpdateUserRoleDto } from './dto/update-user.dto'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { Roles } from '../common/decorators/roles.decorator'

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  // GET /api/users  — solo admin
  @Get()
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Listar todos los usuarios' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.users.findAll(page, limit)
  }

  // GET /api/users/me — perfil propio
  @Get('me')
  @ApiOperation({ summary: 'Ver mi perfil' })
  getMe(@CurrentUser() user: any) {
    return this.users.findById(user.id)
  }

  // PATCH /api/users/me — actualizar perfil propio
  @Patch('me')
  @ApiOperation({ summary: 'Actualizar mi perfil' })
  updateMe(@CurrentUser() user: any, @Body() dto: UpdateUserDto) {
    return this.users.updateProfile(user.id, dto)
  }

  // GET /api/users/:id — solo admin
  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Ver usuario por ID' })
  findOne(@Param('id') id: string) {
    return this.users.findById(id)
  }

  // PATCH /api/users/:id/role — solo admin
  @Patch(':id/role')
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Cambiar rol de un usuario' })
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() admin: any,
  ) {
    return this.users.updateRole(id, dto, admin.id)
  }

  // DELETE /api/users/:id — solo admin
  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Eliminar usuario' })
  remove(@Param('id') id: string, @CurrentUser() admin: any) {
    return this.users.remove(id, admin.id)
  }
}
