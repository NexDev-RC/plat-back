import { Injectable, NotFoundException } from '@nestjs/common'
import { SupabaseService } from '../common/supabase/supabase.service'
import * as PDFDocument from 'pdfkit'

@Injectable()
export class InvoicesService {
  constructor(private supabase: SupabaseService) {}

  async generateInvoice(enrollmentId: string, userId: string): Promise<Buffer> {
    const { data: enrollment, error } = await this.supabase.admin
      .from('enrollments')
      .select(`
        id, enrolled_at,
        users!enrollments_user_id_fkey(id, name, email),
        courses!enrollments_course_id_fkey(
          id, title, slug, price, discount_price,
          users!courses_instructor_id_fkey(id, name)
        )
      `)
      .eq('id', enrollmentId)
      .eq('user_id', userId)
      .single()

    if (error || !enrollment) {
      throw new NotFoundException('Inscripción no encontrada')
    }

    const course = enrollment.courses as any
    const user = enrollment.users as any
    const instructor = course.users as any
    const price = course.discount_price ?? course.price
    const invoiceNumber = `INV-${String(Date.now()).slice(-8)}`
    const dateStr = new Date().toLocaleDateString('es-MX', {
      year: 'numeric', month: 'long', day: 'numeric',
    })

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `Factura ${invoiceNumber}`,
        Author: 'EduFlow',
        Subject: `Compra: ${course.title}`,
      },
    })

    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(chunk))

    return new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      this.drawWatermark(doc)

      const leftX = 50

      doc.fontSize(28).font('Helvetica-Bold').fillColor('#1e40af')
        .text('EduFlow', leftX, 50)
      doc.fontSize(10).font('Helvetica').fillColor('#6b7280')
        .text('Plataforma de Cursos Online', leftX, 82)
        .text('facturas@eduflow.com', leftX, 96)
        .text('+1 (555) 000-0000', leftX, 110)

      doc.fontSize(22).font('Helvetica-Bold').fillColor('#111827')
        .text('FACTURA', 300, 50, { align: 'right' })
      doc.fontSize(10).font('Helvetica').fillColor('#6b7280')
        .text(`No. ${invoiceNumber}`, 300, 78, { align: 'right' })
        .text(`Fecha: ${dateStr}`, 300, 92, { align: 'right' })

      this.drawSeparator(doc, 140)

      doc.fontSize(11).font('Helvetica-Bold').fillColor('#374151')
        .text('FACTURADO A:', leftX, 160)
      doc.fontSize(10).font('Helvetica').fillColor('#4b5563')
        .text(user.name, leftX, 178)
        .text(user.email, leftX, 194)

      doc.fontSize(11).font('Helvetica-Bold').fillColor('#374151')
        .text('CURSO:', 300, 160)
      doc.fontSize(10).font('Helvetica').fillColor('#4b5563')
        .text(course.title, 300, 178)
        .text(`Instructor: ${instructor?.name ?? 'N/A'}`, 300, 194)

      this.drawSeparator(doc, 230)
      this.drawTableHeader(doc, 238)
      this.drawSeparator(doc, 255)

      this.drawTableRow(doc, 268, course.title, 1, price)

      this.drawSeparator(doc, 310)

      const totalY = this.drawTotals(doc, 318, price)

      this.drawSeparator(doc, totalY + 16)

      doc.fontSize(9).font('Helvetica').fillColor('#9ca3af')
        .text('Gracias por tu compra. Este documento es un comprobante oficial de EduFlow.', leftX, 700, { align: 'center' })
        .text('Términos y condiciones: eduflow.com/terms', leftX, 714, { align: 'center' })

      doc.end()
    })
  }

  private drawWatermark(doc: PDFKit.PDFDocument) {
    doc.save()
    doc.opacity(0.07)

    const cx = doc.page.width / 2
    const cy = doc.page.height / 2
    doc.translate(cx, cy - 30)
    doc.scale(2.2)

    doc.moveTo(-32, -22)
    doc.bezierCurveTo(-18, -32, -4, -28, 0, -18)
    doc.lineTo(0, 22)
    doc.bezierCurveTo(-4, 32, -18, 28, -32, 18)
    doc.closePath()

    doc.moveTo(32, -22)
    doc.bezierCurveTo(18, -32, 4, -28, 0, -18)
    doc.lineTo(0, 22)
    doc.bezierCurveTo(4, 32, 18, 28, 32, 18)
    doc.closePath()

    doc.fillColor('#2563eb').fill()

    doc.fontSize(18).font('Helvetica-Bold').fillColor('#2563eb')
    doc.text('EduFlow', -75, 38, { align: 'center', width: 150 })

    doc.restore()
  }

  private drawSeparator(doc: PDFKit.PDFDocument, y: number) {
    doc.moveTo(50, y).lineTo(545, y).strokeColor('#e5e7eb').stroke()
  }

  private drawTableHeader(doc: PDFKit.PDFDocument, y: number) {
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#6b7280')
      .text('DESCRIPCIÓN', 50, y)
      .text('CANT.', 350, y, { width: 50, align: 'center' })
      .text('PRECIO', 420, y, { width: 60, align: 'right' })
      .text('TOTAL', 500, y, { width: 45, align: 'right' })
  }

  private drawTableRow(doc: PDFKit.PDFDocument, y: number, desc: string, qty: number, price: number) {
    doc.fontSize(10).font('Helvetica').fillColor('#111827')
      .text(desc, 50, y)
      .text(String(qty), 350, y, { width: 50, align: 'center' })
      .text(`$${Number(price).toFixed(2)}`, 420, y, { width: 60, align: 'right' })
      .text(`$${Number(price).toFixed(2)}`, 500, y, { width: 45, align: 'right' })
  }

  private drawTotals(doc: PDFKit.PDFDocument, y: number, price: number): number {
    doc.fontSize(10).font('Helvetica').fillColor('#6b7280')
      .text('Subtotal:', 350, y, { width: 130, align: 'right' })
      .text(`$${Number(price).toFixed(2)}`, 500, y, { width: 45, align: 'right' })
    doc.text('IVA (0%):', 350, y + 16, { width: 130, align: 'right' })
      .text('$0.00', 500, y + 16, { width: 45, align: 'right' })
    const totalY = y + 32
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#111827')
      .text('Total:', 350, totalY, { width: 130, align: 'right' })
      .text(`$${Number(price).toFixed(2)}`, 500, totalY, { width: 45, align: 'right' })
    return totalY
  }
}
