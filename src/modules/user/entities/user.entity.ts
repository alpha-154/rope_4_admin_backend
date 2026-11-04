import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import * as bcrypt from 'bcryptjs';
import {
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import mongoose, { Document, HydratedDocument } from 'mongoose';
import { UserRole } from '@/common/interfaces/token-payload.interface';
import { Organization } from '@/modules/organization/entities/organization.entity';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  collection: 'users',
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: any) => {
      delete ret.passwordHash;
      delete ret.refreshTokenHash;
      return ret;
    },
  },
  toObject: { virtuals: true },
})
export class User extends Document {
  @ApiProperty({
    description: 'User email address',
    example: 'admin@rope4.org',
  })
  @Prop({
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  })
  @IsEmail()
  email: string;

  @Prop({ type: String, required: true, select: false })
  passwordHash: string;

  @ApiProperty({ description: 'First name', example: 'Mohiuddin' })
  @Prop({ type: String, required: true, trim: true })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Mahi' })
  @Prop({ type: String, required: true, trim: true })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  @Prop({ type: String, default: null })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({
    description: 'System role',
    enum: UserRole,
    default: UserRole.ADMIN,
  })
  @Prop({
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.ADMIN,
    index: true,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ description: 'Associated Organization ID' })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Organization.name,
    required: true,
    index: true,
  })
  @IsMongoId()
  organizationId: mongoose.Types.ObjectId;

  @Prop({ type: String, default: null, select: false })
  refreshTokenHash?: string;

  @ApiProperty({ description: 'Whether the account is active', default: true })
  @Prop({ type: Boolean, default: true, index: true })
  isActive: boolean;

  @ApiProperty({ description: 'Soft delete flag', default: false })
  @Prop({ type: Boolean, default: false, index: true })
  isDeleted: boolean;

  // Instance method for password comparison
  async comparePassword(plainText: string): Promise<boolean> {
    if (!this.passwordHash) return false;
    return bcrypt.compare(plainText, this.passwordHash);
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

// Virtual for full name
UserSchema.virtual('fullName').get(function (this: User) {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Attach comparePassword to schema methods
UserSchema.methods.comparePassword = async function (
  plainText: string,
): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plainText, this.passwordHash);
};
