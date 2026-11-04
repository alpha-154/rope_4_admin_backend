import { PartialType } from '@nestjs/swagger';
import { CreatePopoverDto } from './create-popover.dto';

export class UpdatePopoverDto extends PartialType(CreatePopoverDto) {}
