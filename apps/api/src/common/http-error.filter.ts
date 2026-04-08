import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import type { Response } from "express";
import type { ApiError, ApiErrorCode } from "@topgun/types";

/**
 * Normalizes every thrown error into the shared `ApiError` envelope.
 * Nest's default exception filter returns inconsistent shapes; this
 * filter guarantees a stable contract for clients.
 */
@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { status, body } = this.toApiError(exception);

    if (status >= 500) {
      this.logger.error(
        `Unhandled exception: ${body.message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json(body);
  }

  private toApiError(exception: unknown): { status: number; body: ApiError } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === "object" && response !== null) {
        const maybe = response as Partial<ApiError> & { message?: unknown };
        if (
          typeof maybe.code === "string" &&
          typeof maybe.message === "string"
        ) {
          return { status, body: maybe as ApiError };
        }
        const message = Array.isArray(maybe.message)
          ? maybe.message.join(", ")
          : typeof maybe.message === "string"
            ? maybe.message
            : exception.message;
        return {
          status,
          body: {
            code: this.mapStatusToCode(status),
            message,
          },
        };
      }
      return {
        status,
        body: {
          code: this.mapStatusToCode(status),
          message: typeof response === "string" ? response : exception.message,
        },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        code: "internal_error",
        message: "Internal server error",
      },
    };
  }

  private mapStatusToCode(status: number): ApiErrorCode {
    switch (status) {
      case 400:
        return "bad_request";
      case 401:
        return "unauthorized";
      case 403:
        return "forbidden";
      case 404:
        return "not_found";
      case 409:
        return "conflict";
      case 422:
        return "unprocessable_entity";
      case 429:
        return "rate_limited";
      default:
        return status >= 500 ? "internal_error" : "bad_request";
    }
  }
}
