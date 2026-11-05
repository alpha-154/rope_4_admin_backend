import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentKey } from '../../config';
import {
  EmailRecipient,
  EmailResult,
  IMailerService,
  SendEmailOptions,
} from './mailer.interface';

@Injectable()
export class BrevoMailerService implements IMailerService {
  private readonly logger = new Logger(BrevoMailerService.name);
  private readonly apiKey: string;
  private readonly defaultSenderEmail: string;
  private readonly defaultSenderName: string;
  private readonly brevoApiUrl = 'https://api.brevo.com/v3/smtp/email';

  constructor(private readonly configService: ConfigService) {
    this.apiKey =
      this.configService.get<string>(EnvironmentKey.BREVO_API_KEY) || '';
    this.defaultSenderEmail =
      this.configService.get<string>(EnvironmentKey.BREVO_SENDER_EMAIL) ||
      'support@rope4.org';
    this.defaultSenderName =
      this.configService.get<string>(EnvironmentKey.BREVO_SENDER_NAME) ||
      'Rope4 Adventure';

    if (
      !this.apiKey ||
      this.apiKey.includes('mock') ||
      this.apiKey.includes('demo')
    ) {
      this.logger.warn(
        '⚠️ Brevo API Key is set to mock/development mode. Outgoing emails will be logged and simulated.',
      );
    } else {
      this.logger.log('📧 Brevo Email Provider initialized with live API key.');
    }
  }

  private normalizeRecipients(
    to: string | string[] | EmailRecipient | EmailRecipient[],
  ): EmailRecipient[] {
    if (Array.isArray(to)) {
      return to.map((item) =>
        typeof item === 'string' ? { email: item.trim() } : item,
      );
    }
    if (typeof to === 'string') {
      return [{ email: to.trim() }];
    }
    return [to];
  }

  async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    const recipients = this.normalizeRecipients(options.to);
    if (recipients.length === 0) {
      return { success: false, error: 'No recipients provided' };
    }

    const sender: EmailRecipient = options.from || {
      name: this.defaultSenderName,
      email: this.defaultSenderEmail,
    };

    // If mock or missing API key, simulate delivery and log nicely
    const isMock =
      !this.apiKey ||
      this.apiKey.includes('mock') ||
      this.apiKey.includes('demo') ||
      this.apiKey.includes('your_brevo');

    if (isMock) {
      this.logger.log(
        `\n================== [BREVO EMAIL EVENT (SIMULATED)] ==================`,
      );
      this.logger.log(
        `📨 To: ${recipients.map((r) => `${r.name || ''} <${r.email}>`).join(', ')}`,
      );
      this.logger.log(`📤 From: ${sender.name} <${sender.email}>`);
      this.logger.log(`📋 Subject: ${options.subject}`);
      this.logger.log(
        `📝 Body Text Preview: ${options.text || options.html.slice(0, 150)}...`,
      );
      this.logger.log(
        `====================================================================\n`,
      );

      return {
        success: true,
        messageId: `simulated-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        simulated: true,
      };
    }

    // Real HTTP Call to Brevo v3 Transactional Email API
    try {
      const payload: Record<string, any> = {
        sender: { name: sender.name, email: sender.email },
        to: recipients.map((r) => ({
          email: r.email,
          ...(r.name ? { name: r.name } : {}),
        })),
        subject: options.subject,
        htmlContent: options.html,
      };

      if (options.text) {
        payload.textContent = options.text;
      }
      if (options.replyTo) {
        payload.replyTo = options.replyTo;
      }
      if (options.tags && options.tags.length > 0) {
        payload.tags = options.tags;
      }
      if (options.params) {
        payload.params = options.params;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(this.brevoApiUrl, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': this.apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `Brevo API returned error status ${response.status}: ${errorBody}`,
        );
        return {
          success: false,
          error: `Brevo API Error (${response.status}): ${errorBody}`,
        };
      }

      const resData = (await response.json()) as { messageId?: string };
      this.logger.log(
        `Email sent successfully via Brevo to ${recipients.map((r) => r.email).join(', ')} [ID: ${resData.messageId || 'ok'}]`,
      );

      return {
        success: true,
        messageId: resData.messageId,
      };
    } catch (err: any) {
      this.logger.error(
        `Failed to dispatch email via Brevo: ${err.message}`,
        err.stack,
      );
      return {
        success: false,
        error: err.message,
      };
    }
  }

  async sendFormSubmissionAlert(
    recipientEmails: string[],
    formName: string,
    submissionData: Record<string, any>,
    submitterInfo: { name?: string; email?: string; ip?: string },
  ): Promise<EmailResult> {
    if (!recipientEmails || recipientEmails.length === 0) {
      recipientEmails = [this.defaultSenderEmail];
    }

    const fieldRows = Object.entries(submissionData)
      .map(
        ([key, val]) => `
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155; text-transform: capitalize; width: 35%;">
            ${key.replace(/([A-Z])/g, ' $1')}
          </td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">
            ${typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')}
          </td>
        </tr>`,
      )
      .join('');

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #1B4D3E; padding: 24px; color: #ffffff; text-align: center;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">Rope4 Platform Alert</h1>
          <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">New Submission: ${formName}</p>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 15px; color: #1e293b; margin-top: 0;">
            A new response was received from <strong>${submitterInfo.name || submitterInfo.email || 'A visitor'}</strong>.
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; background: #f8fafc; border-radius: 6px; overflow: hidden; border: 1px solid #e2e8f0;">
            <tbody>
              ${fieldRows}
              ${
                submitterInfo.ip
                  ? `<tr>
                      <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b;">IP Address</td>
                      <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${submitterInfo.ip}</td>
                    </tr>`
                  : ''
              }
            </tbody>
          </table>
          <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 0;">
            You can review, triage, and reply to this inquiry directly inside the <a href="http://localhost:3001/forms" style="color: #1B4D3E; font-weight: 600; text-decoration: underline;">Rope4 Admin Inbox</a>.
          </p>
        </div>
        <div style="background-color: #f1f5f9; padding: 14px 24px; text-align: center; font-size: 12px; color: #64748b;">
          Rope4 Outdoor Education & Adventure Platform • Automated Notification
        </div>
      </div>
    `;

    return this.sendEmail({
      to: recipientEmails,
      subject: `[New Inquiry] ${formName} - ${submitterInfo.name || submitterInfo.email || 'Visitor'}`,
      html,
      replyTo: submitterInfo.email
        ? { email: submitterInfo.email, name: submitterInfo.name }
        : undefined,
      tags: ['form-submission', formName.toLowerCase().replace(/\s+/g, '-')],
    });
  }

  async sendFormConfirmationToUser(
    submitterEmail: string,
    submitterName: string,
    formName: string,
    confirmationMessage?: string,
  ): Promise<EmailResult> {
    if (!submitterEmail) {
      return { success: false, error: 'No submitter email provided' };
    }

    const messageBody =
      confirmationMessage ||
      `Thank you for contacting Rope4! We have received your inquiry regarding "${formName}". Our expedition team will review your message and get in touch with you shortly.`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #1B4D3E; padding: 24px; color: #ffffff; text-align: center;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 700;">Rope4 Outdoor Education</h1>
          <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Adventure & Alpine Learning Worldwide</p>
        </div>
        <div style="padding: 28px;">
          <p style="font-size: 16px; color: #0f172a; margin-top: 0;">
            Hello ${submitterName || 'Traveler'},
          </p>
          <p style="font-size: 15px; color: #334155; line-height: 1.6;">
            ${messageBody}
          </p>
          <div style="margin: 24px 0; padding: 16px; background-color: #f8fafc; border-left: 4px solid #1B4D3E; border-radius: 4px; font-size: 14px; color: #475569;">
            <strong>Expedition Support:</strong> If you have urgent trek or program questions, feel free to call our emergency line or reply directly to this email.
          </div>
          <p style="font-size: 14px; color: #0f172a; margin-bottom: 0;">
            Warm regards,<br />
            <strong>The Rope4 Team</strong><br />
            <a href="https://rope4.org" style="color: #1B4D3E; text-decoration: none;">rope4.org</a>
          </p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: { email: submitterEmail, name: submitterName },
      subject: `We've received your request: ${formName} - Rope4`,
      html,
      tags: ['customer-confirmation'],
    });
  }
}
