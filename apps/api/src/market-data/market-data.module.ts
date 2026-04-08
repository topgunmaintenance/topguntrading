import { Module } from "@nestjs/common";
import { MarketDataAdapterRegistry } from "./adapter.registry";
import { MarketDataService } from "./market-data.service";
import { MarketDataController } from "./market-data.controller";
import { SubscriptionHub } from "./subscription-hub";
import { MarketDataStreamGateway } from "./market-data-stream.gateway";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [MarketDataController],
  providers: [
    MarketDataAdapterRegistry,
    MarketDataService,
    SubscriptionHub,
    MarketDataStreamGateway,
  ],
  exports: [MarketDataService, MarketDataAdapterRegistry],
})
export class MarketDataModule {}
