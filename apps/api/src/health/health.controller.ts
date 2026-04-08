import { Controller, Get, Inject, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ENV } from "../config/config.module";
import type { Env } from "../config/env";

@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  @Get("healthz")
  health(): { status: "ok"; service: string; env: string } {
    return {
      status: "ok",
      service: "@topgun/api",
      env: this.env.NODE_ENV,
    };
  }

  @Get("readyz")
  async ready(): Promise<{ status: "ok"; db: "up" }> {
    try {
      // cheap round-trip; fails loudly if the pool can't reach Postgres
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "ok", db: "up" };
    } catch {
      throw new ServiceUnavailableException({
        code: "internal_error",
        message: "Database not reachable",
      });
    }
  }
}
