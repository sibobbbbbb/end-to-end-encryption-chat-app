import { Context } from "hono";
import { AuthService } from "@/modules/auth/auth.service";
import { ChallengeRequest, LoginVerifyRequest, RegisterRequest } from "@/modules/auth/auth.schemas";
import { sendSuccess } from "@/shared/utils/api-response";

/**
 * @class AuthController
 * Handles the HTTP layer for authentication. It receives requests,
 * calls the appropriate service methods with request data, and
 * formats the HTTP response (success or error).
 */
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Register a new user.
   */
  public register = async (c: Context) => {
    const validatedData = c.get("validatedData") as RegisterRequest;
    await this.authService.register(validatedData);
    return sendSuccess(c, 201, "User registered successfully");
  };

  /**
   * Login and set tokens.
   */
  public challenge = async (c: Context) => {
    const validatedData = c.get("validatedData") as ChallengeRequest;
    const nonce = await this.authService.challenge(validatedData);
    
    return sendSuccess(c, 200, "Challenge generated", { nonce });
  };
  
  /**
   * Login and set tokens.
   */
  public verify = async (c: Context) => {
    const validatedData = c.get("validatedData") as LoginVerifyRequest;
    const { accessToken } = await this.authService.login(
      validatedData
    );

    return sendSuccess(c, 200, "Login successful", { accessToken });
  };
}
