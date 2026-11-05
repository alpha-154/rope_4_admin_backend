import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import mongoose, { HydratedDocument } from 'mongoose';
import { Organization } from '../../organization/entities/organization.entity';
import { FormDefinition } from './form-definition.entity';

export type FormSubmissionDocument = HydratedDocument<FormSubmission>;

export enum SubmissionStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  RESPONDED = 'responded',
  ARCHIVED = 'archived',
}

@Schema({ timestamps: true, _id: false })
export class SubmissionNote {
  @ApiProperty({ example: 'Alamin (Lead Guide)' })
  @Prop({ type: String, required: true })
  @IsString()
  author: string;

  @ApiProperty({
    example: 'Contacted client via WhatsApp, scheduled briefing call.',
  })
  @Prop({ type: String, required: true })
  @IsString()
  note: string;

  @ApiPropertyOptional()
  @Prop({ type: Date, default: Date.now })
  createdAt?: Date;
}

export const SubmissionNoteSchema =
  SchemaFactory.createForClass(SubmissionNote);

@Schema({ timestamps: true, collection: 'form_submissions' })
export class FormSubmission {
  @ApiProperty({ type: String, description: 'Organization ID' })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Organization.name,
    required: true,
    index: true,
  })
  organizationId: mongoose.Types.ObjectId;

  @ApiProperty({ type: String, description: 'Form Definition ID' })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: FormDefinition.name,
    required: true,
    index: true,
  })
  formId: mongoose.Types.ObjectId;

  @ApiProperty({ example: 'contact-us' })
  @Prop({ type: String, required: true, index: true })
  @IsNotEmpty()
  @IsString()
  formSlug: string;

  @ApiProperty({ example: 'General Contact Us' })
  @Prop({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  formName: string;

  @ApiProperty({
    example: { fullName: 'Rahim Khan', email: 'rahim@example.com' },
  })
  @Prop({ type: mongoose.Schema.Types.Mixed, required: true })
  data: Record<string, any>;

  @ApiProperty({ enum: SubmissionStatus, default: SubmissionStatus.NEW })
  @Prop({
    type: String,
    enum: SubmissionStatus,
    default: SubmissionStatus.NEW,
    index: true,
  })
  @IsEnum(SubmissionStatus)
  status: SubmissionStatus;

  @ApiPropertyOptional({ example: 'Rahim Khan' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  submitterName?: string;

  @ApiPropertyOptional({ example: 'rahim@example.com' })
  @Prop({ type: String, default: '', index: true })
  @IsOptional()
  @IsString()
  submitterEmail?: string;

  @ApiPropertyOptional({ example: '+880 1700 000000' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  submitterPhone?: string;

  @ApiPropertyOptional({ example: '127.0.0.1' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ example: 'Mozilla/5.0...' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({ type: [SubmissionNote] })
  @Prop({ type: [SubmissionNoteSchema], default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmissionNote)
  notes: SubmissionNote[];

  @ApiPropertyOptional({ example: true })
  @Prop({ type: Boolean, default: false })
  emailSent?: boolean;

  @ApiPropertyOptional({ example: 'Sent via Brevo [ID: 12345]' })
  @Prop({ type: String, default: '' })
  emailLog?: string;
}

export const FormSubmissionSchema =
  SchemaFactory.createForClass(FormSubmission);
FormSubmissionSchema.index({ organizationId: 1, createdAt: -1 });
FormSubmissionSchema.index({ organizationId: 1, status: 1 });
