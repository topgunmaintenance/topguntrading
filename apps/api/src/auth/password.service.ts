import { Injectable } from "@nestjs/common";
import * as argon2 from "argon2";

/**
 * Thin wrapper over `argon2` with our Phase 2 defaults. Keeps hashing
 * parameters in one place so they can be tuned as hardware improves.
 *
 * We use Argon2id with memoryCost ~ 64 MB and timeCost 3. These are
 * OWASP-recommended baselines for interactive logins. If the host is
 * memory-constrained in CI, tests inject a weaker config.
 */
@Injectable()
export class PasswordService {
  private readonly options: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 1 << 16, // 64 MB
    timeCost: 3,
    parallelism: 1,
  };

  async hash(plaintext: string): Promise<string> {
    return argon2.hash(plaintext, this.options);
  }

  async verify(hash: string, plaintext: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plaintext);
    } catch {
      return false;
    }
  }
}
