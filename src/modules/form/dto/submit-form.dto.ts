import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject } from 'class-validator';

export class SubmitFormDto {
  @ApiProperty({
    example: {
      fullName: 'Tahmid Hasan',
      email: 'tahmid@example.com',
      phone: '+880 1711 111 222',
      message: 'I want to register a group of 5 for the Keokradong trek.',
    },
    description:
      'Dynamic form values matching the field names configured in FormDefinition',
  })
  @IsNotEmpty()
  @IsObject()
  data: Record<string, any>;
}
