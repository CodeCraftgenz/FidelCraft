import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { EnvConfig } from '../common/config/env.config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService<EnvConfig>) {
    const host = this.configService.get('MAIL_HOST', { infer: true });
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.configService.get('MAIL_PORT', { infer: true }) || 465,
        secure: true,
        auth: {
          user: this.configService.get('MAIL_USER', { infer: true }),
          pass: this.configService.get('MAIL_PASS', { infer: true }),
        },
      });
      this.logger.log('Mail transporter configured');
    } else {
      this.logger.warn('Mail not configured - emails will be logged only');
    }
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.transporter) {
      this.logger.log(`[MAIL-DRY] To: ${to} | Subject: ${subject}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.configService.get('MAIL_USER', { infer: true }),
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
    }
  }

  async sendWelcome(to: string, name: string) {
    await this.send(
      to,
      'Bem-vindo ao FidelCraft!',
      `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px">
        <h1 style="color:#10b981">Bem-vindo, ${name}!</h1>
        <p>Sua conta no FidelCraft foi criada com sucesso.</p>
        <p>Agora voce pode criar sua loja, configurar programas de fidelidade e comecar a fidelizar seus clientes.</p>
        <a href="${this.configService.get('FRONTEND_URL', { infer: true })}/dashboard" style="display:inline-block;background:#10b981;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">Acessar Dashboard</a>
      </div>`,
    );
  }

  async sendPasswordReset(to: string, token: string) {
    const resetUrl = `${this.configService.get('FRONTEND_URL', { infer: true })}/reset-password?token=${token}`;
    await this.send(
      to,
      'Redefinir sua senha - FidelCraft',
      `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px">
        <h1 style="color:#10b981">Redefinir Senha</h1>
        <p>Voce solicitou a redefinicao de senha. Clique no botao abaixo:</p>
        <a href="${resetUrl}" style="display:inline-block;background:#10b981;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">Redefinir Senha</a>
        <p style="margin-top:16px;color:#94a3b8;font-size:14px">Este link expira em 1 hora. Se voce nao solicitou, ignore este email.</p>
      </div>`,
    );
  }

  async sendMemberWelcome(to: string, data: { memberName: string; storeName: string; programName: string }) {
    await this.send(
      to,
      `Voce entrou no programa ${data.programName}!`,
      `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px">
        <h1 style="color:#10b981">Bem-vindo ao programa!</h1>
        <p>Ola ${data.memberName}!</p>
        <p>Voce agora faz parte do programa <strong>${data.programName}</strong> da <strong>${data.storeName}</strong>.</p>
        <p>Acumule pontos a cada compra e resgate premios incriveis!</p>
      </div>`,
    );
  }

  async sendPointsEarned(to: string, data: { memberName: string; points: number; total: number; storeName: string }) {
    await this.send(
      to,
      `+${data.points} pontos na ${data.storeName}!`,
      `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px">
        <h1 style="color:#10b981">+${data.points} pontos!</h1>
        <p>Ola ${data.memberName}, voce ganhou <strong>${data.points} pontos</strong> na ${data.storeName}.</p>
        <p>Saldo atual: <strong>${data.total} pontos</strong></p>
      </div>`,
    );
  }
}
