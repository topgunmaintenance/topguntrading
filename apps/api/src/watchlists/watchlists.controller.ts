import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  AddWatchlistItemRequestSchema,
  CreateWatchlistRequestSchema,
  UpdateWatchlistRequestSchema,
  type AddWatchlistItemRequest,
  type CreateWatchlistRequest,
  type JwtPayload,
  type UpdateWatchlistRequest,
  type Watchlist,
} from "@topgun/types";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { WatchlistsService } from "./watchlists.service";

@Controller("watchlists")
@UseGuards(AuthGuard)
export class WatchlistsController {
  constructor(private readonly service: WatchlistsService) {}

  @Get()
  async list(@CurrentUser() payload: JwtPayload): Promise<{ watchlists: Watchlist[] }> {
    const watchlists = await this.service.list(payload.sub);
    return { watchlists };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() payload: JwtPayload,
    @Body(new ZodValidationPipe(CreateWatchlistRequestSchema))
    body: CreateWatchlistRequest,
  ): Promise<{ watchlist: Watchlist }> {
    const watchlist = await this.service.create(payload.sub, body);
    return { watchlist };
  }

  @Get(":id")
  async get(
    @CurrentUser() payload: JwtPayload,
    @Param("id") id: string,
  ): Promise<{ watchlist: Watchlist }> {
    const watchlist = await this.service.get(payload.sub, id);
    return { watchlist };
  }

  @Patch(":id")
  async update(
    @CurrentUser() payload: JwtPayload,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateWatchlistRequestSchema))
    body: UpdateWatchlistRequest,
  ): Promise<{ watchlist: Watchlist }> {
    const watchlist = await this.service.update(payload.sub, id, body);
    return { watchlist };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() payload: JwtPayload,
    @Param("id") id: string,
  ): Promise<void> {
    await this.service.delete(payload.sub, id);
  }

  @Post(":id/items")
  @HttpCode(HttpStatus.CREATED)
  async addItem(
    @CurrentUser() payload: JwtPayload,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(AddWatchlistItemRequestSchema))
    body: AddWatchlistItemRequest,
  ): Promise<{ watchlist: Watchlist }> {
    const watchlist = await this.service.addItem(payload.sub, id, body.symbol);
    return { watchlist };
  }

  @Delete(":id/items/:itemId")
  async removeItem(
    @CurrentUser() payload: JwtPayload,
    @Param("id") id: string,
    @Param("itemId") itemId: string,
  ): Promise<{ watchlist: Watchlist }> {
    const watchlist = await this.service.removeItem(payload.sub, id, itemId);
    return { watchlist };
  }
}
