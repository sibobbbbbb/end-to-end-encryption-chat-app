import { z } from 'zod';

export const RegisterRequestSchema = z.object({
  username: z.string().min(3).max(50),
  publicKey: z.string().min(1, "Public Key is required"), // hex string
});

export const LoginRequestSchema = z.object({
  username: z.string(),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;