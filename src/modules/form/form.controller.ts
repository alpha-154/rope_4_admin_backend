import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Authorization } from '../../common/decorators/authorization.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GetOrgId } from '../../common/decorators/get-organizationId.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { IApiResponse } from '../../common/interfaces/api-response.interface';
import {
  TokenPayload,
  UserRole,
} from '../../common/interfaces/token-payload.interface';
import { AddSubmissionNoteDto } from './dto/add-submission-note.dto';
import { CreateFormDefinitionDto } from './dto/create-form-definition.dto';
import { QuerySubmissionDto } from './dto/query-submission.dto';
import { SubmitFormDto } from './dto/submit-form.dto';
import { UpdateFormDefinitionDto } from './dto/update-form-definition.dto';
import { UpdateSubmissionStatusDto } from './dto/update-submission-status.dto';
import { FormDefinition } from './entities/form-definition.entity';
import { FormSubmission } from './entities/form-submission.entity';
import { FormService } from './form.service';

@ApiTags('Forms & Inquiries')
@Controller()
export class FormController {
  constructor(private readonly formService: FormService) {}

  // ==========================================
  // --- ADMIN FORM DEFINITIONS ---
  // ==========================================

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'List all form definitions for organization (Admin)',
  })
  @ApiResponse({ status: 200, type: [FormDefinition] })
  @Get('admin/forms')
  async findAllDefinitions(
    @GetOrgId() orgId: string,
  ): Promise<IApiResponse<FormDefinition[]>> {
    const data = await this.formService.findAllDefinitions(orgId);
    return {
      success: true,
      message: 'Form definitions retrieved successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create new form definition (Admin)' })
  @ApiResponse({ status: 201, type: FormDefinition })
  @Post('admin/forms')
  async createDefinition(
    @GetOrgId() orgId: string,
    @Body() dto: CreateFormDefinitionDto,
  ): Promise<IApiResponse<FormDefinition>> {
    const data = await this.formService.createDefinition(orgId, dto);
    return {
      success: true,
      message: 'Form definition created successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get single form definition by ID (Admin)' })
  @ApiResponse({ status: 200, type: FormDefinition })
  @Get('admin/forms/:id')
  async findDefinitionById(
    @Param('id') id: string,
    @GetOrgId() orgId: string,
  ): Promise<IApiResponse<FormDefinition>> {
    const data = await this.formService.findDefinitionById(id, orgId);
    return {
      success: true,
      message: 'Form definition retrieved successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update form definition (Admin)' })
  @ApiResponse({ status: 200, type: FormDefinition })
  @Patch('admin/forms/:id')
  async updateDefinition(
    @Param('id') id: string,
    @GetOrgId() orgId: string,
    @Body() dto: UpdateFormDefinitionDto,
  ): Promise<IApiResponse<FormDefinition>> {
    const data = await this.formService.updateDefinition(id, orgId, dto);
    return {
      success: true,
      message: 'Form definition updated successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete form definition (Admin)' })
  @ApiResponse({ status: 200 })
  @Delete('admin/forms/:id')
  async deleteDefinition(
    @Param('id') id: string,
    @GetOrgId() orgId: string,
  ): Promise<IApiResponse<null>> {
    await this.formService.deleteDefinition(id, orgId);
    return {
      success: true,
      message: 'Form definition deleted successfully',
      data: null,
    };
  }

  // ==========================================
  // --- ADMIN SUBMISSIONS INBOX ---
  // ==========================================

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'List submitted inquiries in inbox (Admin)' })
  @ApiResponse({ status: 200, type: [FormSubmission] })
  @Get('admin/forms/submissions/inbox')
  async findSubmissions(
    @GetOrgId() orgId: string,
    @Query() query: QuerySubmissionDto,
  ): Promise<IApiResponse<FormSubmission[]>> {
    const result = await this.formService.findSubmissions(orgId, query);
    return {
      success: true,
      message: 'Inquiries retrieved successfully',
      data: result.data as FormSubmission[],
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get single submission details (Admin)' })
  @ApiResponse({ status: 200, type: FormSubmission })
  @Get('admin/forms/submissions/:id')
  async findSubmissionById(
    @Param('id') id: string,
    @GetOrgId() orgId: string,
  ): Promise<IApiResponse<FormSubmission>> {
    const data = await this.formService.findSubmissionById(id, orgId);
    return {
      success: true,
      message: 'Submission retrieved successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update inquiry triage status (Admin)' })
  @ApiResponse({ status: 200, type: FormSubmission })
  @Patch('admin/forms/submissions/:id/status')
  async updateSubmissionStatus(
    @Param('id') id: string,
    @GetOrgId() orgId: string,
    @Body() dto: UpdateSubmissionStatusDto,
  ): Promise<IApiResponse<FormSubmission>> {
    const data = await this.formService.updateSubmissionStatus(
      id,
      orgId,
      dto.status,
    );
    return {
      success: true,
      message: `Status updated to ${dto.status}`,
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Add internal staff triage note (Admin)' })
  @ApiResponse({ status: 200, type: FormSubmission })
  @Post('admin/forms/submissions/:id/notes')
  async addSubmissionNote(
    @Param('id') id: string,
    @GetOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
    @Body() dto: AddSubmissionNoteDto,
  ): Promise<IApiResponse<FormSubmission>> {
    const author =
      `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    const data = await this.formService.addSubmissionNote(
      id,
      orgId,
      author,
      dto.note,
    );
    return {
      success: true,
      message: 'Note added successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete submission from inbox (Admin)' })
  @ApiResponse({ status: 200 })
  @Delete('admin/forms/submissions/:id')
  async deleteSubmission(
    @Param('id') id: string,
    @GetOrgId() orgId: string,
  ): Promise<IApiResponse<null>> {
    await this.formService.deleteSubmission(id, orgId);
    return {
      success: true,
      message: 'Submission deleted successfully',
      data: null,
    };
  }

  // ==========================================
  // --- PUBLIC ENDPOINTS (WEBSITE) ---
  // ==========================================

  @ApiOperation({
    summary: 'Get active form schema and fields by slug (Website)',
  })
  @ApiResponse({ status: 200, type: FormDefinition })
  @Get('public/forms/:slug')
  async getPublicFormBySlug(
    @Param('slug') slug: string,
    @GetOrgId({ required: false }) orgId?: string,
    @Query('organizationId') queryOrgId?: string,
  ): Promise<IApiResponse<FormDefinition>> {
    const targetOrgId = orgId || queryOrgId;
    const data = await this.formService.findDefinitionBySlug(slug, targetOrgId);
    return {
      success: true,
      message: 'Form definition retrieved successfully',
      data,
    };
  }

  @ApiOperation({ summary: 'Submit contact or trek inquiry form (Website)' })
  @ApiResponse({ status: 201, type: FormSubmission })
  @Post('public/forms/:slug/submit')
  async submitForm(
    @Param('slug') slug: string,
    @Body() dto: SubmitFormDto,
    @Req() req: Request,
    @GetOrgId({ required: false }) orgId?: string,
    @Query('organizationId') queryOrgId?: string,
  ): Promise<IApiResponse<FormSubmission>> {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '';
    const userAgent = req.headers['user-agent'] || '';
    const targetOrgId = orgId || queryOrgId;

    const data = await this.formService.submitForm(slug, dto, {
      ip,
      userAgent,
      organizationId: targetOrgId,
    });

    return {
      success: true,
      message: 'Inquiry submitted successfully. Confirmation email dispatched.',
      data,
    };
  }
}
