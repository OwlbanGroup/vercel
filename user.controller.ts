import { Controller, Patch, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { IsArray, IsString } from 'class-validator';
import { ApiTags, ApiBody, ApiResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { Roles } from './auth/roles.decorator';
import { RolesGuard } from './auth/roles.guard';
import { UserService } from './user.service';
import { ApiRoles } from './auth/swagger-auth.decorator';

// DTO for updating user roles
class UpdateRolesDto {
  @IsArray()
  @IsString({ each: true })
  roles!: string[];
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseGuards(JwtAuthGuard, RolesGuard) // Apply JWT auth and Roles guard
@ApiTags('users') // Group endpoints under 'users' tag in Swagger UI
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch(':id/roles')
  @Roles('admin') // Only admins can change roles
  @Roles('admin') // NestJS RBAC decorator
  @ApiRoles('admin') // Swagger decorator for roles
  @ApiOperation({ summary: 'Update roles for a specific user (Admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID of the user to update' })
  @ApiBody({ type: UpdateRolesDto })
  @ApiResponse({ status: 200, description: 'User roles updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRolesDto: UpdateRolesDto,
  ) {
    return this.userService.updateUserRoles(id, updateRolesDto.roles);
  }
}