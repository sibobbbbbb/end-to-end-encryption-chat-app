import { Hono } from "hono";
import {
  LoginVerifyRequestSchema,
  ChallengeRequestSchema,
  RegisterRequestSchema,
} from "@/modules/auth/auth.schemas";
import { validate } from "@/shared/middlewares/validation.middleware";
import { authController } from "@/container";
import { authLimiter } from "@/shared/middlewares/rate-limiter.middleware";

/**
 * @file Defines the routes for authentication-related endpoints.
 *
 * This router handles all routes prefixed with `/api/auth`, including
 * user registration, login, token refreshing, and logout. It applies
 * necessary middlewares like rate limiting and validation for each route.
 */
const authRouter = new Hono();

authRouter.post(
  "/register",
  authLimiter,
  validate(RegisterRequestSchema),
  authController.register
);

authRouter.post(
  "/challenge",
  authLimiter,
  validate(ChallengeRequestSchema),
  authController.challenge
);

authRouter.post(
  "/login",
  authLimiter,
  validate(LoginVerifyRequestSchema),
  authController.verify
);

export default authRouter;
