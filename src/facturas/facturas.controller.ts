import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  Headers,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger'
import { Response } from 'express'
import { FacturasService } from './facturas.service'
import { CreateFacturaDto } from './dto/factura.dto'
import { Public } from '../common/decorators/public.decorator'

@ApiTags('Facturas')
@Controller('facturas')
export class FacturasController {
  constructor(private readonly facturasService: FacturasService) {}

  @Public()
  @Post('generate')
  @ApiOperation({ 
    summary: 'Generar factura PDF',
    description: 'Genera una factura PDF con los datos proporcionados y la devuelve para descarga'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'PDF generado exitosamente',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiConsumes('application/json')
  async generateFactura(
    @Body() createFacturaDto: CreateFacturaDto,
    @Res() res: Response,
    @Headers('user-agent') userAgent: string,
  ) {
    try {
      const pdfBuffer = await this.facturasService.generateFactura(createFacturaDto)

      // Limpiar el nombre del archivo para evitar caracteres inválidos
      const sanitizedName = createFacturaDto.nombre
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase()

      const filename = `factura_${sanitizedName}_${Date.now()}.pdf`

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      })

      res.send(pdfBuffer)
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error al generar la factura',
        error: error.message,
      })
    }
  }
}
