import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Authorization } from '@/common/decorators/authorization.decorator';
import { GetOrgId } from '@/common/decorators/get-organizationId.decorator';
import { AuthGuard } from '@/common/guards/auth.guard';
import { UserRole } from '@/common/interfaces/token-payload.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('v1/admin/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create staff user for organization' })
  @ApiResponse({ status: 201, type: User })
  async create(@GetOrgId() orgId: string, @Body() dto: CreateUserDto) {
    return this.userService.create(orgId, dto);
  }

  @Get()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'List all staff users in organization' })
  @ApiResponse({ status: 200, type: [User] })
  async findAll(@GetOrgId() orgId: string) {
    return this.userService.findAllByOrg(orgId);
  }

  @Get(':id')
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get staff user by ID' })
  @ApiResponse({ status: 200, type: User })
  async findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Patch(':id')
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update staff user' })
  @ApiResponse({ status: 200, type: User })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete staff user (soft delete)' })
  @ApiResponse({ status: 200 })
  async remove(@Param('id') id: string) {
    await this.userService.softDelete(id);
    return { message: 'User deleted successfully' };
  }
}

