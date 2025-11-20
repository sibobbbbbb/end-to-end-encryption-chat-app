import { z } from 'zod';

/* 
 * Define schemas for user registration and login requests.
 * These schemas will be used to validate incoming request data.
 * 
 * The schemas ensure that:
 * - Registration requires a name, email, and password.
 * - Login requires an email and password.
 */
export const RegisterRequestSchema = z.object({
  name: z.string().min(3),
  email: z.email(),
  password: z.string().min(8),
});

export const LoginRequestSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/*
 * Extended ECC authentication schemas
 *
 * These schemas are used for the end‑to‑end encrypted chat application.  Users register
 * by providing a username and public key generated client‑side from their password.
 * During login, the client requests a challenge and then signs it with their private key.
 */
export const EccRegisterSchema = z.object({
  username: z.string().min(3),
  publicKey: z.string(),
});

export const LoginChallengeSchema = z.object({
  username: z.string().min(3),
});

// The login verification schema accepts any signature object.  While the
// frontend should send an object with `r` and `s` hex strings, allowing
// `signature` to be `z.any()` prevents Zod from rejecting valid signatures
// due to subtle type mismatches.  The controller will perform actual
// structure validation.
export const LoginVerifySchema = z.object({
  username: z.string().min(3),
  signature: z.any(),
});

export type EccRegisterRequest = z.infer<typeof EccRegisterSchema>;
export type LoginChallengeRequest = z.infer<typeof LoginChallengeSchema>;
export type LoginVerifyRequest = z.infer<typeof LoginVerifySchema>;