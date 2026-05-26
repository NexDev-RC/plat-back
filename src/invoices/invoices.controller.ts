import { Controller, Get, Param, Res, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { Response } from 'express'
import { InvoicesService } from './invoices.service'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('Invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(private invoices: InvoicesService) {}

  @Get(':enrollmentId')
  @ApiOperation({ summary: 'Descargar factura de una inscripción en PDF' })
  async download(
    @Param('enrollmentId') enrollmentId: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const pdf = await this.invoices.generateInvoice(enrollmentId, user.id)

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="factura-${enrollmentId}.pdf"`,
      'Content-Length': pdf.length,
    })

    res.status(HttpStatus.OK).send(pdf)
  }
}
