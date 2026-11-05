import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import {
  FooterSettings,
  HeaderSettings,
} from '../entities/site-settings.entity';

export class UpdateSiteSettingsDto {
  @ApiPropertyOptional({ type: HeaderSettings })
  @IsOptional()
  @ValidateNested()
  @Type(() => HeaderSettings)
  header?: HeaderSettings;

  @ApiPropertyOptional({ type: FooterSettings })
  @IsOptional()
  @ValidateNested()
  @Type(() => FooterSettings)
  footer?: FooterSettings;
}
