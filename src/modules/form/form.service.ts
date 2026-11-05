import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { escapeRegex } from '../../common/utils/escape-regex.util';
import { sanitizeHtml } from '../../common/utils/sanitize-html.util';
import { BrevoMailerService } from '../mailer/brevo-mailer.service';
import { OrganizationService } from '../organization/organization.service';
import { CreateFormDefinitionDto } from './dto/create-form-definition.dto';
import { QuerySubmissionDto } from './dto/query-submission.dto';
import { SubmitFormDto } from './dto/submit-form.dto';
import { UpdateFormDefinitionDto } from './dto/update-form-definition.dto';
import {
  FormDefinition,
  FormDefinitionDocument,
  FormFieldType,
} from './entities/form-definition.entity';
import {
  FormSubmission,
  FormSubmissionDocument,
  SubmissionStatus,
} from './entities/form-submission.entity';

@Injectable()
export class FormService {
  private readonly logger = new Logger(FormService.name);

  constructor(
    @InjectModel(FormDefinition.name)
    private readonly formModel: Model<FormDefinitionDocument>,
    @InjectModel(FormSubmission.name)
    private readonly submissionModel: Model<FormSubmissionDocument>,
    private readonly mailerService: BrevoMailerService,
    private readonly orgService: OrganizationService,
  ) {}

  // --- FORM DEFINITION CRUD & SEEDING ---

  private async seedDefaultForms(orgObjId: Types.ObjectId) {
    const contactForm = {
      organizationId: orgObjId,
      name: 'General Contact Us',
      slug: 'contact-us',
      description: 'Standard inquiries from the website contact page',
      notificationEmails: ['support@rope4.org'],
      confirmationSubject: 'We received your message - Rope4 Outdoor Education',
      confirmationMessage:
        'Thank you for contacting Rope4! Our expedition and logistics team will review your inquiry and get back to you within 24 hours.',
      isActive: true,
      fields: [
        {
          name: 'fullName',
          label: 'Full Name',
          type: FormFieldType.TEXT,
          placeholder: 'e.g. Rahim Khan',
          required: true,
          order: 1,
        },
        {
          name: 'email',
          label: 'Email Address',
          type: FormFieldType.EMAIL,
          placeholder: 'e.g. rahim@example.com',
          required: true,
          order: 2,
        },
        {
          name: 'phone',
          label: 'Phone / WhatsApp',
          type: FormFieldType.TEL,
          placeholder: 'e.g. +880 1711 000000',
          required: true,
          order: 3,
        },
        {
          name: 'interest',
          label: 'Subject / Area of Interest',
          type: FormFieldType.SELECT,
          placeholder: 'Select program type',
          required: false,
          options: [
            'Himalayan Expeditions',
            'Youth & Student Summer Camps',
            'Basic Mountaineering Course (BMC)',
            'Corporate Team Building',
            'Gear & Equipment Purchase',
            'Other Inquiry',
          ],
          order: 4,
        },
        {
          name: 'message',
          label: 'Message / Questions',
          type: FormFieldType.TEXTAREA,
          placeholder: 'How can we help your next adventure?',
          required: true,
          order: 5,
        },
      ],
    };

    const trekInquiryForm = {
      organizationId: orgObjId,
      name: 'Custom Trek / Expedition Inquiry',
      slug: 'trek-inquiry',
      description: 'Custom fixed-departure booking and group trek inquiries',
      notificationEmails: ['expeditions@rope4.org'],
      confirmationSubject: 'Expedition Request Received - Rope4',
      confirmationMessage:
        'Your custom trek inquiry has been received. Our mountain guides will review your target dates, fitness levels, and group size to prepare a personalized itinerary.',
      isActive: true,
      fields: [
        {
          name: 'fullName',
          label: 'Lead Contact Name',
          type: FormFieldType.TEXT,
          placeholder: 'e.g. Farhana Ahmed',
          required: true,
          order: 1,
        },
        {
          name: 'email',
          label: 'Email Address',
          type: FormFieldType.EMAIL,
          placeholder: 'e.g. farhana@example.com',
          required: true,
          order: 2,
        },
        {
          name: 'phone',
          label: 'WhatsApp Phone Number',
          type: FormFieldType.TEL,
          placeholder: '+880 1819 000000',
          required: true,
          order: 3,
        },
        {
          name: 'destination',
          label: 'Desired Trek / Destination',
          type: FormFieldType.SELECT,
          required: true,
          options: [
            'Kedarkantha Snow Trek (India)',
            'Hampta Pass Crossing (India)',
            'Keokradong Summit (Bandarban)',
            'Saka Haphong Trail (Bandarban)',
            'Annapurna Circuit (Nepal)',
            'Custom Wilderness Course',
          ],
          order: 4,
        },
        {
          name: 'groupSize',
          label: 'Number of Travelers / Students',
          type: FormFieldType.NUMBER,
          placeholder: 'e.g. 4',
          required: true,
          order: 5,
        },
        {
          name: 'preferredMonth',
          label: 'Target Departure Month',
          type: FormFieldType.SELECT,
          required: false,
          options: [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
          ],
          order: 6,
        },
        {
          name: 'specialRequirements',
          label: 'Special Requirements / Dietary / Medical Notes',
          type: FormFieldType.TEXTAREA,
          placeholder: 'Any prior trek experience or requirements...',
          required: false,
          order: 7,
        },
      ],
    };

    const created = await this.formModel.create([contactForm, trekInquiryForm]);
    this.logger.log(`Seeded default forms for organization ${orgObjId}`);
    return created;
  }

  async findAllDefinitions(
    organizationId: string,
  ): Promise<FormDefinitionDocument[]> {
    const orgObjId = new Types.ObjectId(organizationId);
    let forms = await this.formModel
      .find({ organizationId: orgObjId })
      .sort({ createdAt: -1 })
      .exec();

    if (forms.length === 0) {
      forms = await this.seedDefaultForms(orgObjId);
    }

    return forms;
  }

  async findDefinitionById(
    id: string,
    organizationId: string,
  ): Promise<FormDefinitionDocument> {
    const orgObjId = new Types.ObjectId(organizationId);
    const form = await this.formModel
      .findOne({ _id: new Types.ObjectId(id), organizationId: orgObjId })
      .exec();

    if (!form) {
      throw new NotFoundException('Form definition not found');
    }
    return form;
  }

  async findDefinitionBySlug(
    slug: string,
    organizationId?: string,
  ): Promise<FormDefinitionDocument> {
    const filter: FilterQuery<FormDefinitionDocument> = {
      slug: slug.toLowerCase().trim(),
      isActive: true,
    };

    if (organizationId && Types.ObjectId.isValid(organizationId)) {
      filter.organizationId = new Types.ObjectId(organizationId);
    }

    let form = await this.formModel.findOne(filter).exec();

    // If not found and no specific orgId was given, look up default org
    if (!form && (!organizationId || !Types.ObjectId.isValid(organizationId))) {
      const defaultOrg = await this.orgService.findDefaultOrFirst();
      if (defaultOrg) {
        form = await this.formModel
          .findOne({
            slug: slug.toLowerCase().trim(),
            organizationId: defaultOrg._id,
            isActive: true,
          })
          .exec();

        if (!form) {
          // Trigger seeding if needed
          const seeded = await this.seedDefaultForms(defaultOrg._id);
          form = (seeded.find((s) => s.slug === slug) as any) || null;
        }
      }
    }

    if (!form) {
      throw new NotFoundException(`Active form with slug "${slug}" not found`);
    }

    return form;
  }

  async createDefinition(
    organizationId: string,
    dto: CreateFormDefinitionDto,
  ): Promise<FormDefinitionDocument> {
    const orgObjId = new Types.ObjectId(organizationId);
    const slug = (dto.slug || dto.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/--+/g, '-');

    const existing = await this.formModel.findOne({
      organizationId: orgObjId,
      slug,
    });
    if (existing) {
      throw new ConflictException(`A form with slug "${slug}" already exists`);
    }

    const form = new this.formModel({
      ...dto,
      slug,
      organizationId: orgObjId,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    return form.save();
  }

  async updateDefinition(
    id: string,
    organizationId: string,
    dto: UpdateFormDefinitionDto,
  ): Promise<FormDefinitionDocument> {
    const orgObjId = new Types.ObjectId(organizationId);
    const form = await this.findDefinitionById(id, organizationId);

    if (dto.slug && dto.slug !== form.slug) {
      const slug = dto.slug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9_-]/g, '-')
        .replace(/--+/g, '-');

      const existing = await this.formModel.findOne({
        organizationId: orgObjId,
        slug,
        _id: { $ne: form._id },
      });
      if (existing) {
        throw new ConflictException(
          `A form with slug "${slug}" already exists`,
        );
      }
      form.slug = slug;
    }

    if (dto.name) form.name = dto.name;
    if (dto.description !== undefined) form.description = dto.description;
    if (dto.fields) form.fields = dto.fields as any;
    if (dto.notificationEmails)
      form.notificationEmails = dto.notificationEmails;
    if (dto.confirmationSubject !== undefined)
      form.confirmationSubject = dto.confirmationSubject;
    if (dto.confirmationMessage !== undefined)
      form.confirmationMessage = dto.confirmationMessage;
    if (dto.isActive !== undefined) form.isActive = dto.isActive;

    return form.save();
  }

  async deleteDefinition(id: string, organizationId: string): Promise<void> {
    const orgObjId = new Types.ObjectId(organizationId);
    const res = await this.formModel.findOneAndDelete({
      _id: new Types.ObjectId(id),
      organizationId: orgObjId,
    });

    if (!res) {
      throw new NotFoundException('Form definition not found');
    }
  }

  // --- SUBMISSIONS INBOX & PUBLIC SUBMISSION ---

  async submitForm(
    slug: string,
    dto: SubmitFormDto,
    meta: { ip?: string; userAgent?: string; organizationId?: string },
  ): Promise<FormSubmissionDocument> {
    const form = await this.findDefinitionBySlug(slug, meta.organizationId);

    // Validate required fields based on form definition
    const submittedData = dto.data || {};
    const sanitizedData: Record<string, any> = {};

    for (const field of form.fields) {
      const val = submittedData[field.name];

      if (field.required) {
        if (
          val === undefined ||
          val === null ||
          (typeof val === 'string' && val.trim() === '')
        ) {
          throw new BadRequestException(`Field "${field.label}" is required`);
        }
      }

      // XSS sanitize string inputs
      if (typeof val === 'string') {
        sanitizedData[field.name] = sanitizeHtml(val.trim());
      } else {
        sanitizedData[field.name] = val;
      }
    }

    // Capture any extra fields safely
    for (const [key, val] of Object.entries(submittedData)) {
      if (sanitizedData[key] === undefined) {
        sanitizedData[key] =
          typeof val === 'string' ? sanitizeHtml(val.trim()) : val;
      }
    }

    // Extract submitter identity for fast inbox triage
    const submitterName =
      sanitizedData.fullName ||
      sanitizedData.name ||
      sanitizedData.contactName ||
      sanitizedData.leadContact ||
      '';
    const submitterEmail =
      sanitizedData.email || sanitizedData.emailAddress || '';
    const submitterPhone =
      sanitizedData.phone ||
      sanitizedData.phoneNumber ||
      sanitizedData.mobile ||
      sanitizedData.whatsapp ||
      '';

    const submission = new this.submissionModel({
      organizationId: form.organizationId,
      formId: form._id,
      formSlug: form.slug,
      formName: form.name,
      data: sanitizedData,
      status: SubmissionStatus.NEW,
      submitterName,
      submitterEmail,
      submitterPhone,
      ipAddress: meta.ip || '',
      userAgent: meta.userAgent || '',
      notes: [],
      emailSent: false,
      emailLog: '',
    });

    const savedSubmission = await submission.save();

    // Trigger Brevo transactional email delivery asynchronously in background
    (async () => {
      try {
        const staffAlert = await this.mailerService.sendFormSubmissionAlert(
          form.notificationEmails,
          form.name,
          sanitizedData,
          { name: submitterName, email: submitterEmail, ip: meta.ip },
        );

        let userConfirmMsg = '';
        if (submitterEmail) {
          const userConfirm =
            await this.mailerService.sendFormConfirmationToUser(
              submitterEmail,
              submitterName,
              form.name,
              form.confirmationMessage,
            );
          userConfirmMsg = ` | Confirmation: ${userConfirm.success ? 'Sent' : 'Failed'}`;
        }

        await this.submissionModel.updateOne(
          { _id: savedSubmission._id },
          {
            emailSent: staffAlert.success,
            emailLog: `Staff Alert: ${staffAlert.messageId || (staffAlert.simulated ? 'Simulated' : 'Sent')}${userConfirmMsg}`,
          },
        );
      } catch (err: any) {
        this.logger.error(
          `Error sending Brevo notification for submission ${savedSubmission._id}: ${err.message}`,
        );
        await this.submissionModel.updateOne(
          { _id: savedSubmission._id },
          { emailSent: false, emailLog: `Delivery Error: ${err.message}` },
        );
      }
    })();

    return savedSubmission;
  }

  async findSubmissions(organizationId: string, query: QuerySubmissionDto) {
    const orgObjId = new Types.ObjectId(organizationId);
    const page = query.page && query.page > 0 ? Number(query.page) : 1;
    const limit = query.limit && query.limit > 0 ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;

    const filter: FilterQuery<FormSubmissionDocument> = {
      organizationId: orgObjId,
    };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.formSlug) {
      filter.formSlug = query.formSlug;
    }

    if (query.search) {
      const safeTerm = escapeRegex(query.search.trim());
      const searchRegex = new RegExp(safeTerm, 'i');
      filter.$or = [
        { submitterName: searchRegex },
        { submitterEmail: searchRegex },
        { submitterPhone: searchRegex },
        { formName: searchRegex },
      ];
    }

    const [items, total] = await Promise.all([
      this.submissionModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.submissionModel.countDocuments(filter).exec(),
    ]);

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findSubmissionById(
    id: string,
    organizationId: string,
  ): Promise<FormSubmissionDocument> {
    const orgObjId = new Types.ObjectId(organizationId);
    const item = await this.submissionModel
      .findOne({ _id: new Types.ObjectId(id), organizationId: orgObjId })
      .exec();

    if (!item) {
      throw new NotFoundException('Submission not found');
    }
    return item;
  }

  async updateSubmissionStatus(
    id: string,
    organizationId: string,
    status: SubmissionStatus,
  ): Promise<FormSubmissionDocument> {
    const item = await this.findSubmissionById(id, organizationId);
    item.status = status;
    return item.save();
  }

  async addSubmissionNote(
    id: string,
    organizationId: string,
    author: string,
    noteText: string,
  ): Promise<FormSubmissionDocument> {
    const item = await this.findSubmissionById(id, organizationId);
    item.notes.push({
      author,
      note: sanitizeHtml(noteText),
      createdAt: new Date(),
    });
    return item.save();
  }

  async deleteSubmission(id: string, organizationId: string): Promise<void> {
    const orgObjId = new Types.ObjectId(organizationId);
    const res = await this.submissionModel.findOneAndDelete({
      _id: new Types.ObjectId(id),
      organizationId: orgObjId,
    });

    if (!res) {
      throw new NotFoundException('Submission not found');
    }
  }
}
