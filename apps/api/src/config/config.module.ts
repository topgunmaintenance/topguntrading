import { Global, Module } from "@nestjs/common";
import { env } from "./env";

export const ENV = Symbol("TopGunEnv");

/**
 * A tiny global module that exposes the validated env to the rest of
 * the app via the `ENV` token. We don't use @nestjs/config's schema
 * facilities because we already validate with zod through @topgun/config.
 */
@Global()
@Module({
  providers: [
    {
      provide: ENV,
      useValue: env,
    },
  ],
  exports: [ENV],
})
export class AppConfigModule {}
