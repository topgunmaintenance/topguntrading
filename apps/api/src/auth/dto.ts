/**
 * DTO re-exports so controllers import the zod schemas from a local
 * path instead of reaching into @topgun/types for request shapes
 * directly. This keeps a clean boundary without duplicating the
 * contract.
 */
export {
  SignupRequestSchema,
  LoginRequestSchema,
  type SignupRequest,
  type LoginRequest,
  type AuthResponse,
} from "@topgun/types";
