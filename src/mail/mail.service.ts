import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'
import * as fs from 'fs'
import * as path from 'path'

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private transporter: nodemailer.Transporter

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('MAIL_HOST'),
      port: this.config.get<number>('MAIL_PORT', 587),
      secure: this.config.get('MAIL_SECURE', 'false') === 'true',
      auth: {
        user: this.config.get('MAIL_USER'),
        pass: this.config.get('MAIL_PASS'),
      },
    })
  }

  // ── Bienvenida al registrarse ─────────────────────────────────────────────

  async sendWelcome(user: { name: string; email: string }) {
    const html = this.renderTemplate('welcome', {
      name: user.name,
      appUrl: this.config.get('FRONTEND_URL', 'http://localhost:3000'),
      year: new Date().getFullYear(),
    })

    await this.send({
      to: user.email,
      subject: '¡Bienvenido/a a EduFlow! 🎉',
      html,
    })

    this.logger.log(`Correo de bienvenida enviado a ${user.email}`)
  }

  // ── Confirmación de inscripción a un curso ────────────────────────────────

  async sendEnrollmentConfirmation(params: {
    user: { name: string; email: string }
    course: { title: string; id: string }
  }) {
    const { user, course } = params
    const courseUrl = `${this.config.get('FRONTEND_URL', 'http://localhost:3000')}/courses/${course.id}`

    const html = this.renderTemplate('enrollment', {
      name: user.name,
      courseTitle: course.title,
      courseUrl,
      year: new Date().getFullYear(),
    })

    await this.send({
      to: user.email,
      subject: `¡Inscripción confirmada! ${course.title}`,
      html,
    })

    this.logger.log(`Correo de inscripción enviado a ${user.email} para curso "${course.title}"`)
  }

  // ── Confirmación de pago exitoso (preparado para el futuro) ───────────────

  async sendPaymentConfirmation(params: {
    user: { name: string; email: string }
    course: { title: string; id: string }
    amount: number
    currency: string
    transactionId: string
  }) {
    const { user, course, amount, currency, transactionId } = params
    const courseUrl = `${this.config.get('FRONTEND_URL', 'http://localhost:3000')}/courses/${course.id}`

    const html = this.renderTemplate('payment', {
      name: user.name,
      courseTitle: course.title,
      courseUrl,
      amount: new Intl.NumberFormat('es-BO', { style: 'currency', currency }).format(amount),
      transactionId,
      date: new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' }),
      year: new Date().getFullYear(),
    })

    await this.send({
      to: user.email,
      subject: `Pago confirmado - ${course.title} ✅`,
      html,
    })

    this.logger.log(`Correo de pago enviado a ${user.email}`)
  }

  // ── Helpers privados ──────────────────────────────────────────────────────

  private async send(options: { to: string; subject: string; html: string }) {
    await this.transporter.sendMail({
      from: `"${this.config.get('MAIL_FROM_NAME', 'EduFlow')}" <${this.config.get('MAIL_FROM_ADDRESS')}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
  }

  private renderTemplate(templateName: string, variables: Record<string, any>): string {
    const templatePath = path.join(__dirname, 'templates', `${templateName}.html`)
    let html = fs.readFileSync(templatePath, 'utf-8')

    for (const [key, value] of Object.entries(variables)) {
      html = html.replaceAll(`{{${key}}}`, String(value))
    }

    return html
  }
}
