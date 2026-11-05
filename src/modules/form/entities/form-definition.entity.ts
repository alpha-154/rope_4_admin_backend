import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import mongoose, { HydratedDocument } from 'mongoose';
import { Organization } from '../../organization/entities/organization.entity';

export type FormDefinitionDocument = HydratedDocument<FormDefinition>;

export enum FormFieldType {
  TEXT = 'text',
  EMAIL = 'email',
  TEL = 'tel',
  TEXTAREA = 'textarea',
  SELECT = 'select',
  NUMBER = 'number',
  DATE = 'date',
}

@Schema({ _id: false })
export class FormField {
  @ApiProperty({ example: 'fullName' })
  @Prop({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Full Name' })
  @Prop({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  label: string;

  @ApiProperty({ enum: FormFieldType, default: FormFieldType.TEXT })
  @Prop({ type: String, enum: FormFieldType, default: FormFieldType.TEXT })
  @IsEnum(FormFieldType)
  type: FormFieldType;

  @ApiPropertyOptional({ example: 'Enter your name' })
  @Prop({ type: String })
  @IsOptional()
  @IsString()
  placeholder?: string;

  @ApiProperty({ example: true })
  @Prop({ type: Boolean, default: false })
  @IsBoolean()
  required: boolean;

  @ApiPropertyOptional({
    example: ['Kedarkantha', 'Hampta Pass', 'Keokradong'],
  })
  @Prop({ type: [String], default: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ example: 1 })
  @Prop({ type: Number, default: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;
}

export const FormFieldSchema = SchemaFactory.createForClass(FormField);

@Schema({ timestamps: true, collection: 'form_definitions' })
export class FormDefinition {
  @ApiProperty({ type: String, description: 'Organization ID' })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Organization.name,
    required: true,
    index: true,
  })
  organizationId: mongoose.Types.ObjectId;

  @ApiProperty({ example: 'General Contact Us' })
  @Prop({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'contact-us' })
  @Prop({ type: String, required: true, index: true })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiPropertyOptional({ example: 'Inquiries from the website contact page' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [FormField] })
  @Prop({ type: [FormFieldSchema], default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormField)
  fields: FormField[];

  @ApiProperty({ example: ['support@rope4.org'] })
  @Prop({ type: [String], default: [] })
  @IsArray()
  @IsString({ each: true })
  notificationEmails: string[];

  @ApiPropertyOptional({ example: 'We received your message - Rope4' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  confirmationSubject?: string;

  @ApiPropertyOptional({
    example:
      'Thank you for reaching out! Our team will respond within 24 hours.',
  })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  confirmationMessage?: string;

  @ApiProperty({ example: true })
  @Prop({ type: Boolean, default: true })
  @IsBoolean()
  isActive: boolean;
}

export const FormDefinitionSchema =
  SchemaFactory.createForClass(FormDefinition);
FormDefinitionSchema.index({ organizationId: 1, slug: 1 }, { unique: true });
