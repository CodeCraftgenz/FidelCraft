import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ZodError } from 'zod';
import { AppException } from './app.exception';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Erro interno do servidor';
    let details: unknown = undefined;

    if (exception instanceof AppException) {
      status = exception.getStatus();
      code = exception.code;
      const res = exception.getResponse() as Record<string, unknown>;
      message = (res.message as string) || message;
      details = exception.details;
    } else if (exception instanceof ThrottlerException) {
      status = HttpStatus.TOO_MANY_REQUESTS;
      code = 'TOO_MANY_REQUESTS';
      message = 'Muitas requisicoes. Tente novamente em alguns minutos.';
    } else if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      code = 'VALIDATION_ERROR';
      message = 'Dados invalidos';
      details = exception.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
    } else if (exception instanceof PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        code = 'DUPLICATE_ENTRY';
        const target = (exception.meta?.target as string[]) || [];
        message = `Registro duplicado: ${target.join(', ')}`;
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        code = 'NOT_FOUND';
        message = 'Registro nao encontrado';
      } else {
        this.logger.error(`Prisma error ${exception.code}`, exception.message);
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : ((res as Record<string, unknown>).message as string) || message;
    } else {
      this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : String(exception));
    }

    response.status(status).json({
      success: false,
      error: { code, message, ...(details ? { details } : {}) },
      timestamp: new Date().toISOString(),
    });
  }
}
