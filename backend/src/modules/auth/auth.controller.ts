import { Context } from "hono";
import { getCookie } from "hono/cookie";
import { AuthService } from "@/modules/auth/auth.service";
import { LoginRequest, RegisterRequest } from "@/modules/auth/auth.schemas";
import { sendSuccess } from "@/shared/utils/api-response";
import { UnauthorizedError } from "@/shared/exceptions/api-error";
import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from "@/shared/utils/cookie-helper";
import { ec as EC } from "elliptic";
import crypto from "crypto";
import { sha3_256 } from "js-sha3";
import {
  EccRegisterRequest,
  LoginChallengeRequest,
  LoginVerifyRequest,
} from "@/modules/auth/auth.schemas";
import { generateTokens } from "@/modules/auth/auth.token.helper";

/**
 * @class AuthController
 * Handles the HTTP layer for authentication. It receives requests,
 * calls the appropriate service methods with request data, and
 * formats the HTTP response (success or error).
 */
export class AuthController {
  constructor(private authService: AuthService) {}

  // In-memory stores for ECC users and login challenges.
  // These are used for demonstration and should be replaced with persistent storage in production.
  private static eccUsers: Map<string, string> = new Map();
  private static loginChallenges: Map<string, string> = new Map();

  /**
   * Register a new user.
   */
  public register = async (c: Context) => {
    const validatedData = c.get("validatedData") as RegisterRequest;
    const newUser = await this.authService.register(validatedData);
    const { password: _password, refreshToken: _refreshToken, ...safeUser } = newUser;
    return sendSuccess(c, 201, "User registered successfully", safeUser);
  };

  /**
   * Login and set tokens.
   */
  public login = async (c: Context) => {
    const validatedData = c.get("validatedData") as LoginRequest;
    const { accessToken, refreshToken } = await this.authService.login(
      validatedData
    );

    setRefreshTokenCookie(c, refreshToken);

    return sendSuccess(c, 200, "Login successful", { accessToken });
  };

  /**
   * Refresh access token.
   */
  public refreshToken = async (c: Context) => {
    const refreshToken = getCookie(c, "refreshToken");
    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token not found");
    }

    const { accessToken } = await this.authService.refreshToken(refreshToken);
    return sendSuccess(c, 200, "Token refreshed successfully", {
      accessToken,
    });
  };

  /**
   * Logout and remove refresh token.
   */
  public logout = async (c: Context) => {
    const { sub: userId } = c.get("jwtPayload");
    await this.authService.logout(userId);

    clearRefreshTokenCookie(c);

    return sendSuccess(c, 200, "Logout successful");
  };

  /**
   * Register a new ECC user.  Stores the username and public key in an in-memory map.
   */
  public registerEcc = async (c: Context) => {
    const data = c.get("validatedData") as EccRegisterRequest;
    const { username, publicKey } = data;
    if (AuthController.eccUsers.has(username)) {
      return sendSuccess(c, 409, "Username already registered");
    }
    AuthController.eccUsers.set(username, publicKey);
    return sendSuccess(c, 201, "ECC user registered successfully");
  };

  /**
   * Issue a nonce challenge for ECC login.  Generates a random nonce and stores it for the user.
   */
  public loginChallenge = async (c: Context) => {
    const data = c.get("validatedData") as LoginChallengeRequest;
    const { username } = data;
    const publicKey = AuthController.eccUsers.get(username);
    if (!publicKey) {
      return sendSuccess(c, 404, "User not found");
    }
    const nonce = crypto.randomBytes(16).toString("hex");
    AuthController.loginChallenges.set(username, nonce);
    return sendSuccess(c, 200, "Login challenge issued", { nonce });
  };

  /**
   * Verify the client's signature of the nonce and issue JWT tokens on success.
   */
  public loginVerify = async (c: Context) => {
    const data = c.get("validatedData") as LoginVerifyRequest;
    const { username, signature } = data;
    const publicKey = AuthController.eccUsers.get(username);
    const nonce = AuthController.loginChallenges.get(username);
    if (!publicKey || !nonce) {
      return sendSuccess(c, 400, "Challenge not found");
    }
    try {
      const ec = new EC("secp256k1");
      const key = ec.keyFromPublic(publicKey, "hex");
      // Hash the nonce using SHA3-256 before verification.  The client signs
      // the hash of the nonce, so we must verify against the same hash.
      // Compute the SHA3‑256 hash of the nonce using js-sha3.  Using this
      // library avoids relying on Node's built-in support for the SHA3 family
      // and ensures consistent behaviour across environments.
      const nonceHash = sha3_256(nonce);
      const isValid = key.verify(nonceHash, signature);
      if (!isValid) {
        return sendSuccess(c, 401, "Invalid signature");
      }
      // Remove nonce after verification
      AuthController.loginChallenges.delete(username);
      // Generate tokens (user id unknown for ECC user; using 0)
      const tokens = await generateTokens({
        sub: 0,
        name: username,
      });
      setRefreshTokenCookie(c, tokens.refreshToken);
      return sendSuccess(c, 200, "Login successful", {
        accessToken: tokens.accessToken,
      });
    } catch (_e) {
      return sendSuccess(c, 400, "Error verifying signature");
    }
  };
}
