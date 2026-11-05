import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizationModule } from '../organization/organization.module';
import {
  FormDefinition,
  FormDefinitionSchema,
} from './entities/form-definition.entity';
import {
  FormSubmission,
  FormSubmissionSchema,
} from './entities/form-submission.entity';
import { FormController } from './form.controller';
import { FormService } from './form.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FormDefinition.name, schema: FormDefinitionSchema },
      { name: FormSubmission.name, schema: FormSubmissionSchema },
    ]),
    OrganizationModule,
  ],
  controllers: [FormController],
  providers: [FormService],
  exports: [FormService],
})
export class FormModule {}
