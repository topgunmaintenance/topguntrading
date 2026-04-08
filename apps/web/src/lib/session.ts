import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, type TokenPair, type User } from "@topgun/types";
import { apiClient, ApiCallError } from "./api-client";

const COMMON_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

/**
 * Set both the access token and refresh token as HTTP-only cookies on
 * the outgoing response. Called from auth route handlers after a
 * successful signup / login / refresh.
 */
export function writeAuthCookies(tokens: TokenPair): void {
  const store = cookies();
  const accessMaxAge = Math.max(
    0,
    Math.floor((new Date(tokens.accessTokenExpiresAt).getTime() - Date.now()) / 1000),
  );
  const refreshMaxAge = Math.max(
    0,
    Math.floor((new Date(tokens.refreshTokenExpiresAt).getTime() - Date.now()) / 1000),
  );
  store.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...COMMON_COOKIE_OPTIONS,
    maxAge: accessMaxAge,
  });
  store.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...COMMON_COOKIE_OPTIONS,
    maxAge: refreshMaxAge,
  });
}

export function clearAuthCookies(): void {
  const store = cookies();
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
}

export function readAccessToken(): string | undefined {
  return cookies().get(ACCESS_TOKEN_COOKIE)?.value;
}

export function readRefreshToken(): string | undefined {
  return cookies().get(REFRESH_TOKEN_COOKIE)?.value;
}

/**
 * Read the current user from the API using the stored access token.
 * Returns null if there is no valid session. This is used by server
 * components to decide whether to redirect to the login page.
 */
export async function getCurrentUser(): Promise<User | null> {
  const token = readAccessToken();
  if (!token) return null;
  try {
    const { user } = await apiClient.me(token);
    return user;
  } catch (error) {
    if (error instanceof ApiCallError && (error.status === 401 || error.status === 403)) {
      return null;
    }
    throw error;
  }
}
