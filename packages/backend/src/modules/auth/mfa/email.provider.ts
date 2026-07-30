import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST', 'smtp.gmail.com'),
      port: this.config.get('SMTP_PORT', 587),
      secure: this.config.get('SMTP_SECURE', false),
      auth: {
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASS'),
      },
    });
  }

  async send(to: string, subject: string, html: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: `"Al Mokhtabar Lab" <${this.config.get('SMTP_FROM', 'noreply@almokhtabar.com')}>`,
        to,
        subject,
        html,
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      return false;
    }
  }

  async sendOTPEmail(
    to: string,
    code: string,
    lang: string = 'ar',
  ): Promise<boolean> {
    const subject =
      lang === 'ar'
        ? 'رمز التحقق - المختبر'
        : 'Verification Code - Al Mokhtabar';
    const html =
      lang === 'ar'
        ? this.getOTPTemplateAr(code)
        : this.getOTPTemplateEn(code);
    return this.send(to, subject, html);
  }

  async sendVerificationEmail(
    to: string,
    token: string,
    lang: string = 'ar',
  ): Promise<boolean> {
    const url = `${this.config.get('FRONTEND_URL', 'http://localhost:3000')}/auth/verify-email?token=${token}`;
    const subject =
      lang === 'ar'
        ? 'تأكيد البريد الإلكتروني - المختبر'
        : 'Verify Email - Al Mokhtabar';
    const html =
      lang === 'ar'
        ? `<div dir="rtl" style="font-family: 'Cairo', sans-serif;"><h1>مرحباً بك في المختبر</h1><p>يرجى النقر على الرابط لتأكيد بريدك الإلكتروني:</p><a href="${url}" style="background:#2563EB;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">تأكيد البريد</a><p>هذا الرابط صالح لمدة ساعة واحدة.</p></div>`
        : `<div style="font-family: 'Inter', sans-serif;"><h1>Welcome to Al Mokhtabar</h1><p>Please click the link to verify your email:</p><a href="${url}" style="background:#2563EB;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Verify Email</a><p>This link is valid for 1 hour.</p></div>`;
    return this.send(to, subject, html);
  }

  async sendPasswordResetEmail(
    to: string,
    token: string,
    lang: string = 'ar',
  ): Promise<boolean> {
    const url = `${this.config.get('FRONTEND_URL', 'http://localhost:3000')}/auth/reset-password?token=${token}`;
    const subject =
      lang === 'ar'
        ? 'إعادة تعيين كلمة المرور - المختبر'
        : 'Reset Password - Al Mokhtabar';
    const html =
      lang === 'ar'
        ? `<div dir="rtl" style="font-family: 'Cairo', sans-serif;"><h1>إعادة تعيين كلمة المرور</h1><p>طلبنا إعادة تعيين كلمة المرور الخاصة بك. اضغط على الرابط:</p><a href="${url}" style="background:#DC2626;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">إعادة التعيين</a><p>صالح لمدة ساعة. إذا لم تطلب هذا، تجاهل هذه الرسالة.</p></div>`
        : `<div style="font-family: 'Inter', sans-serif;"><h1>Reset Your Password</h1><p>We received a request to reset your password. Click the link:</p><a href="${url}" style="background:#DC2626;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Reset Password</a><p>Valid for 1 hour. If you didn't request this, ignore this email.</p></div>`;
    return this.send(to, subject, html);
  }

  async sendSecurityAlert(
    to: string,
    alert: {
      title: string;
      description: string;
      ip: string;
      device: string;
    },
    lang: string = 'ar',
  ): Promise<boolean> {
    const subject =
      lang === 'ar'
        ? 'تنبيه أمني - المختبر'
        : 'Security Alert - Al Mokhtabar';
    const html =
      lang === 'ar'
        ? `<div dir="rtl" style="font-family: 'Cairo', sans-serif;"><h1 style="color:#DC2626">⚠ تنبيه أمني</h1><h2>${alert.title}</h2><p>${alert.description}</p><ul><li>العنوان: ${alert.ip}</li><li>الجهاز: ${alert.device}</li></ul><p>إذا كان هذا أنت، يمكنك تجاهل هذه الرسالة.</p></div>`
        : `<div style="font-family: 'Inter', sans-serif;"><h1 style="color:#DC2626">⚠ Security Alert</h1><h2>${alert.title}</h2><p>${alert.description}</p><ul><li>IP: ${alert.ip}</li><li>Device: ${alert.device}</li></ul><p>If this was you, you can ignore this message.</p></div>`;
    return this.send(to, subject, html);
  }

  private getOTPTemplateAr(code: string): string {
    return `<div dir="rtl" style="font-family: 'Cairo', sans-serif; max-width:600px; margin:0 auto; padding:40px; background:#f8fafc; border-radius:12px;"><div style="text-align:center; margin-bottom:32px;"><h1 style="color:#2563EB; font-size:28px;">المختبر</h1></div><div style="background:white; padding:32px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.1);"><h2 style="text-align:center; color:#1e293b;">رمز التحقق</h2><div style="text-align:center; margin:24px 0;"><span style="font-size:48px; font-weight:bold; color:#2563EB; letter-spacing:8px; background:#f1f5f9; padding:16px 32px; border-radius:8px; display:inline-block;">${code}</span></div><p style="text-align:center; color:#64748b; font-size:14px;">صالح لمدة 5 دقائق فقط</p><hr style="border:none; border-top:1px solid #e2e8f0; margin:24px 0;"><p style="text-align:center; color:#94a3b8; font-size:12px;">لا تشارك هذا الرمز مع أي شخص. المختبر لن يطلب منك هذا الرمز أبداً.</p></div></div>`;
  }

  private getOTPTemplateEn(code: string): string {
    return `<div style="font-family: 'Inter', sans-serif; max-width:600px; margin:0 auto; padding:40px; background:#f8fafc; border-radius:12px;"><div style="text-align:center; margin-bottom:32px;"><h1 style="color:#2563EB; font-size:28px;">Al Mokhtabar Lab</h1></div><div style="background:white; padding:32px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.1);"><h2 style="text-align:center; color:#1e293b;">Verification Code</h2><div style="text-align:center; margin:24px 0;"><span style="font-size:48px; font-weight:bold; color:#2563EB; letter-spacing:8px; background:#f1f5f9; padding:16px 32px; border-radius:8px; display:inline-block;">${code}</span></div><p style="text-align:center; color:#64748b; font-size:14px;">Valid for 5 minutes only</p><hr style="border:none; border-top:1px solid #e2e8f0; margin:24px 0;"><p style="text-align:center; color:#94a3b8; font-size:12px;">Do not share this code with anyone. Al Mokhtabar will never ask for this code.</p></div></div>`;
  }
}
