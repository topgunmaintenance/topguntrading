import { Module } from "@nestjs/common";
import { WorkspacesService } from "./workspaces.service";

/**
 * Phase 2 workspace module: service only, no controller yet. A
 * dedicated workspaces controller arrives in Phase 3 when watchlists
 * and layouts land.
 */
@Module({
  providers: [WorkspacesService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
