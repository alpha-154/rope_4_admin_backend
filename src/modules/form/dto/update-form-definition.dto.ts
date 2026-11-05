import { PartialType } from '@nestjs/swagger';
import { CreateFormDefinitionDto } from './create-form-definition.dto';

export class UpdateFormDefinitionDto extends PartialType(
  CreateFormDefinitionDto,
) {}
