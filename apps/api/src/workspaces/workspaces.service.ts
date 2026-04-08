import { Injectable } from "@nestjs/common";
import type { Workspace } from "@topgun/types";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Minimal workspace service for Phase 2. Users get a default workspace
 * automatically when they sign in for the first time. Watchlists,
 * layouts, and symbol preferences land in Phase 3.
 */
@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateDefault(userId: string): Promise<Workspace> {
    const existing = await this.prisma.workspace.findFirst({
      where: { userId, isDefault: true },
    });
    if (existing) return this.toPublic(existing);

    const created = await this.prisma.workspace.create({
      data: {
        userId,
        name: "Default",
        isDefault: true,
      },
    });
    return this.toPublic(created);
  }

  private toPublic(row: {
    id: string;
    userId: string;
    name: string;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Workspace {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      isDefault: row.isDefault,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
