import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { WsAdapter } from "@nestjs/platform-ws";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { env } from "./config/env";
import { HttpErrorFilter } from "./common/http-error.filter";

async function bootstrap(): Promise<void> {
  const logger = new Logger("bootstrap");

  const app = await NestFactory.create(AppModule, {
    logger: env.NODE_ENV === "production" ? ["log", "warn", "error"] : ["log", "debug", "warn", "error"],
  });

  app.use(cookieParser());

  app.enableCors({
    origin: env.API_CORS_ORIGINS,
    credentials: true,
  });

  app.useGlobalFilters(new HttpErrorFilter());
  app.useWebSocketAdapter(new WsAdapter(app));

  await app.listen(env.API_PORT);
  logger.log(`TopGun Trading API listening on port ${env.API_PORT}`);
  logger.log(`CORS allowed origins: ${env.API_CORS_ORIGINS.join(", ")}`);
  logger.log(`Market data provider: ${env.MARKET_DATA_PROVIDER}`);
  logger.log(`Market data stream path: /stream`);
}

bootstrap().catch((error) => {
   
  console.error("Fatal bootstrap error", error);
  process.exit(1);
});
