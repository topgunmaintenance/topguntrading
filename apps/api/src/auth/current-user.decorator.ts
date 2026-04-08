import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { JwtPayload } from "@topgun/types";
import type { AuthenticatedRequest } from "./auth.guard";

/**
 * Extracts the decoded JWT payload that `AuthGuard` attached to the
 * request. Use after `@UseGuards(AuthGuard)`.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
