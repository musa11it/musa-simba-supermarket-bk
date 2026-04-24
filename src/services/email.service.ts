import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter(): void {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    } catch (error) {
      console.warn('⚠️  Email service not configured');
    }
  }

  async send(options: EmailOptions): Promise<boolean> {
    if (!this.transporter || !process.env.EMAIL_USER) {
      console.log('📧 [MOCK EMAIL]', {
        to: options.to,
        subject: options.subject,
      });
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'Simba Supermarket <noreply@simba.rw>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      return true;
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }

  async sendWelcome(to: string, name: string): Promise<boolean> {
    return this.send({
      to,
      subject: 'Welcome to Simba Supermarket! 🛒',
      html: this.welcomeTemplate(name),
    });
  }

  async sendOrderConfirmation(to: string, orderNumber: string, total: number): Promise<boolean> {
    return this.send({
      to,
      subject: `Order Confirmed - ${orderNumber}`,
      html: this.orderConfirmationTemplate(orderNumber, total),
    });
  }

  async sendBranchApprovalRequest(to: string, branchName: string, createdBy: string): Promise<boolean> {
    return this.send({
      to,
      subject: `New Branch Approval Request: ${branchName}`,
      html: this.approvalRequestTemplate(branchName, createdBy),
    });
  }

  async sendBranchApproved(to: string, branchName: string): Promise<boolean> {
    return this.send({
      to,
      subject: `Your branch "${branchName}" has been approved`,
      html: this.approvedTemplate(branchName),
    });
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<boolean> {
    return this.send({
      to,
      subject: 'Reset your Simba password',
      html: this.passwordResetTemplate(resetUrl),
    });
  }

  private baseTemplate(content: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f3f4f6;">
      <div style="max-width:600px;margin:40px auto;background:white;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:30px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:28px;">🛒 SIMBA</h1>
          <p style="color:#fca5a5;margin:5px 0 0;">Rwanda's #1 Supermarket</p>
        </div>
        <div style="padding:30px;color:#1f2937;">
          ${content}
        </div>
        <div style="background:#f9fafb;padding:20px;text-align:center;color:#6b7280;font-size:12px;">
          <p style="margin:0;">© 2026 Simba Supermarket. Kigali, Rwanda.</p>
        </div>
      </div>
    </body>
    </html>`;
  }

  private welcomeTemplate(name: string): string {
    return this.baseTemplate(`
      <h2 style="color:#dc2626;">Welcome, ${name}! 👋</h2>
      <p>Thank you for joining Simba Supermarket — Rwanda's largest supermarket chain.</p>
      <p>Start shopping now and enjoy:</p>
      <ul>
        <li>🚚 Fast pick-up from 10+ branches</li>
        <li>🤖 AI-powered product search</li>
        <li>💳 Easy MoMo payments</li>
        <li>🌍 Shop in English, Kinyarwanda, or French</li>
      </ul>
    `);
  }

  private orderConfirmationTemplate(orderNumber: string, total: number): string {
    return this.baseTemplate(`
      <h2 style="color:#dc2626;">Order Confirmed! ✅</h2>
      <p>Your order <strong>${orderNumber}</strong> has been received.</p>
      <p><strong>Total:</strong> ${total.toLocaleString()} RWF</p>
      <p>Our branch staff are preparing your order. You'll be notified when it's ready for pick-up.</p>
    `);
  }

  private approvalRequestTemplate(branchName: string, createdBy: string): string {
    return this.baseTemplate(`
      <h2 style="color:#dc2626;">New Branch Approval Needed</h2>
      <p>Admin <strong>${createdBy}</strong> has submitted a new branch for approval:</p>
      <p style="background:#fef2f2;padding:15px;border-radius:8px;"><strong>${branchName}</strong></p>
      <p>Please log in to the Super Admin dashboard to review and approve.</p>
    `);
  }

  private approvedTemplate(branchName: string): string {
    return this.baseTemplate(`
      <h2 style="color:#16a34a;">Branch Approved! 🎉</h2>
      <p>Great news! Your branch <strong>${branchName}</strong> has been approved by the Super Admin.</p>
      <p>It's now live and visible to customers. You can start managing orders from your dashboard.</p>
    `);
  }

  private passwordResetTemplate(resetUrl: string): string {
    return this.baseTemplate(`
      <h2 style="color:#dc2626;">Reset Your Password</h2>
      <p>Click the button below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetUrl}" style="display:inline-block;background:#dc2626;color:white;padding:12px 30px;border-radius:8px;text-decoration:none;margin:20px 0;">Reset Password</a>
      <p style="color:#6b7280;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
    `);
  }
}

export const emailService = new EmailService();
export default emailService;
