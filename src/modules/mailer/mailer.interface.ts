export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendEmailOptions {
  to: string | string[] | EmailRecipient | EmailRecipient[];
  subject: string;
  html: string;
  text?: string;
  from?: EmailRecipient;
  replyTo?: EmailRecipient;
  tags?: string[];
  params?: Record<string, any>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

export interface IMailerService {
  sendEmail(options: SendEmailOptions): Promise<EmailResult>;
  sendFormSubmissionAlert(
    recipientEmails: string[],
    formName: string,
    submissionData: Record<string, any>,
    submitterInfo: { name?: string; email?: string; ip?: string },
  ): Promise<EmailResult>;
  sendFormConfirmationToUser(
    submitterEmail: string,
    submitterName: string,
    formName: string,
    confirmationMessage?: string,
  ): Promise<EmailResult>;
}
