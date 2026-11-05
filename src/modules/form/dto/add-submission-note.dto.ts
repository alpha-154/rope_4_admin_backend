import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddSubmissionNoteDto {
  @ApiProperty({ example: 'Confirmed deposit received via bank transfer.' })
  @IsNotEmpty()
  @IsString()
  note: string;
}
