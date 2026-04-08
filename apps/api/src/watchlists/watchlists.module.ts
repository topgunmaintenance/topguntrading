import { Module } from "@nestjs/common";
import { WatchlistsController } from "./watchlists.controller";
import { WatchlistsService } from "./watchlists.service";
import { AuthModule } from "../auth/auth.module";
import { MarketDataModule } from "../market-data/market-data.module";

@Module({
  imports: [AuthModule, MarketDataModule],
  controllers: [WatchlistsController],
  providers: [WatchlistsService],
  exports: [WatchlistsService],
})
export class WatchlistsModule {}
