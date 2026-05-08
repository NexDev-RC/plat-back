import { Injectable } from '@nestjs/common'
import { CreateFacturaDto } from './dto/factura.dto'
import * as pdf from 'html-pdf'

@Injectable()
export class FacturasService {
  async generateFactura(facturaData: CreateFacturaDto): Promise<Buffer> {
    console.log('Iniciando generación de factura con datos:', facturaData)
    
    try {
      // HTML simple para el PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Factura EduFlow</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .info { margin-bottom: 20px; }
            .table { border-collapse: collapse; width: 100%; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f2f2f2; }
            .total { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>FACTURA</h1>
          </div>
          
          <div class="info">
            <h3>EduFlow Platform</h3>
            <p>NIT: 900.000.000-0</p>
            <p>Dirección: Calle 123 #45-67</p>
            <p>Teléfono: +57 1 234 5678</p>
            <p>Email: info@eduflow.com</p>
          </div>
          
          <div class="info">
            <h3>Datos del Cliente</h3>
            <p><strong>Nombre:</strong> ${facturaData.nombre}</p>
            <p><strong>NIT:</strong> ${facturaData.nit}</p>
            <p><strong>Fecha:</strong> ${new Date(facturaData.fecha).toLocaleDateString('es-CO')}</p>
          </div>
          
          <table class="table">
            <tr>
              <th>Descripción</th>
              <th>Cantidad</th>
              <th>Precio Unitario</th>
              <th>Total</th>
            </tr>
            <tr>
              <td>Acceso a Plataforma EduFlow</td>
              <td>1</td>
              <td>$299,900</td>
              <td>$299,900</td>
            </tr>
          </table>
          
          <div class="info">
            <p><strong>Subtotal:</strong> $299,900</p>
            <p><strong>IVA (19%):</strong> $56,981</p>
            <p class="total"><strong>Total a Pagar:</strong> $356,881</p>
          </div>
          
          <div class="info">
            <p><strong>Notas:</strong></p>
            <p>Esta factura genera acceso completo a la plataforma EduFlow.</p>
            <p>El acceso es válido por 12 meses desde la fecha de emisión.</p>
            <p>Para soporte técnico, contactar a soporte@eduflow.com</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; font-size: 12px;">
            <p>EduFlow Platform - Todos los derechos reservados</p>
            <p>www.eduflow.com</p>
          </div>
        </body>
        </html>
      `
      
      // Opciones para el PDF
      const options = {
        format: 'A4',
        orientation: 'portrait',
        border: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        }
      }
      
      // Generar PDF usando html-pdf
      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        pdf.create(htmlContent, options).toBuffer((err, buffer) => {
          if (err) {
            console.error('Error generando PDF:', err)
            // Fallback: devolver HTML como texto plano
            resolve(Buffer.from(htmlContent || ''))
          } else {
            resolve(buffer)
          }
        })
      })
      
      return pdfBuffer
      
    } catch (error) {
      console.error('Error en generateFactura:', error)
      throw error
    }
  }
}
