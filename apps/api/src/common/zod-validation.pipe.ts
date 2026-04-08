import { BadRequestException, Injectable, type PipeTransform } from "@nestjs/common";
import { type ZodType, ZodError } from "zod";
import type { ApiError } from "@topgun/types";

/**
 * A PipeTransform that validates request bodies against a zod schema.
 * On failure, throws a `BadRequestException` whose payload matches the
 * shared `ApiError` shape so clients can render field-level errors.
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const fields: Record<string, string> = {};
        for (const issue of error.issues) {
          const path = issue.path.join(".") || "(root)";
          if (!fields[path]) {
            fields[path] = issue.message;
          }
        }
        const payload: ApiError = {
          code: "unprocessable_entity",
          message: "Request failed validation",
          fields,
        };
        throw new BadRequestException(payload);
      }
      throw error;
    }
  }
}
