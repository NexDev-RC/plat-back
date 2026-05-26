import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query,
  ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { UserDetailsService } from './user-details.service'
import { CreateUserDetailsDto, UpdateUserDetailsDto } from './dto/user-details.dto'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { Roles } from '../common/decorators/roles.decorator'

@ApiTags('User Details')
@ApiBearerAuth()
@Controller('user-details')
export class UserDetailsController {
  constructor(private userDetails: UserDetailsService) {}

  // GET /api/user-details — solo admin
  @Get()
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Listar todos los detalles de usuarios' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.userDetails.findAll(page, limit)
  }

  // GET /api/user-details/me — perfil propio
  @Get('me')
  @ApiOperation({ summary: 'Ver mis detalles de perfil' })
  getMe(@CurrentUser() user: any) {
    return this.userDetails.findByUserId(user.id)
  }

  // POST /api/user-details/me — crear detalles propios
  @Post('me')
  @ApiOperation({ summary: 'Crear mis detalles de perfil' })
  createMe(@CurrentUser() user: any, @Body() dto: CreateUserDetailsDto) {
    return this.userDetails.create(user.id, dto)
  }

  // PATCH /api/user-details/me — actualizar detalles propios
  @Patch('me')
  @ApiOperation({ summary: 'Actualizar mis detalles de perfil' })
  updateMe(@CurrentUser() user: any, @Body() dto: UpdateUserDetailsDto) {
    return this.userDetails.update(user.id, dto)
  }

  // GET /api/user-details/:userId — solo admin
  @Get(':userId')
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Ver detalles de un usuario por user_id' })
  findOne(@Param('userId') userId: string) {
    return this.userDetails.findByUserId(userId)
  }

  // POST /api/user-details/:userId — solo admin
  @Post(':userId')
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Crear detalles para un usuario' })
  create(@Param('userId') userId: string, @Body() dto: CreateUserDetailsDto) {
    return this.userDetails.create(userId, dto)
  }

  // PATCH /api/user-details/:userId — solo admin
  @Patch(':userId')
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Actualizar detalles de un usuario' })
  update(@Param('userId') userId: string, @Body() dto: UpdateUserDetailsDto) {
    return this.userDetails.update(userId, dto)
  }

  // DELETE /api/user-details/:userId — solo admin
  @Delete(':userId')
  @Roles('admin')
  @ApiOperation({ summary: '[Admin] Eliminar detalles de un usuario' })
  remove(@Param('userId') userId: string) {
    return this.userDetails.remove(userId)
  }
}
