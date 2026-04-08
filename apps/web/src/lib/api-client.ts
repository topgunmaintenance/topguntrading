import type {
  ApiError,
  AuthResponse,
  LoginRequest,
  SignupRequest,
  User,
} from "@topgun/types";
import { env } from "./env";

/**
 * Server-side only API client.
 *
 * All functions here are intended to run inside Next.js route handlers
 * or server components. They never run in the browser — the API is
 * reachable only via our own route handlers, which set HTTP-only
 * cookies. This keeps tokens out of JavaScript land entirely.
 */

export class ApiCallError extends Error {
  readonly status: number;
  readonly body: ApiError;

  constructor(status: number, body: ApiError) {
    super(body.message);
    this.status = status;
    this.body = body;
  }
}

async function callApi<T>(
  path: string,
  init: RequestInit & { forwardCookie?: string | undefined } = {},
): Promise<T> {
  const { forwardCookie, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set("content-type", "application/json");
  headers.set("accept", "application/json");
  if (forwardCookie) headers.set("cookie", forwardCookie);

  const response = await fetch(`${env.API_INTERNAL_URL}${path}`, {
    ...rest,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    let body: ApiError;
    try {
      body = (await response.json()) as ApiError;
    } catch {
      body = {
        code: "internal_error",
        message: `API call failed with status ${response.status}`,
      };
    }
    throw new ApiCallError(response.status, body);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const apiClient = {
  signup(body: SignupRequest): Promise<AuthResponse> {
    return callApi<AuthResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  login(body: LoginRequest): Promise<AuthResponse> {
    return callApi<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  refresh(refreshToken: string): Promise<AuthResponse> {
    return callApi<AuthResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  },

  logout(refreshToken: string): Promise<void> {
    return callApi<void>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  },

  me(accessToken: string): Promise<{ user: User }> {
    return callApi<{ user: User }>("/auth/me", {
      method: "GET",
      headers: { authorization: `Bearer ${accessToken}` },
    });
  },
};
