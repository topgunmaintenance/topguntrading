import { Controller, Get, UseGuards } from "@nestjs/common";
import type { User, JwtPayload } from "@topgun/types";
import { UsersService } from "./users.service";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";

@Controller("users")
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get("me")
  async me(@CurrentUser() payload: JwtPayload): Promise<{ user: User }> {
    const user = await this.users.getPublicUser(payload.sub);
    return { user };
  }
}
