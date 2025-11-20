import { z } from 'zod';

// Register Request Schema
export const RegisterRequestSchema = z.object({
  username: z.string().min(3).max(50),
  publicKey: z.string().min(1, "Public Key is required"), // hex string
});

// Login - Challenge Schema
export const ChallengeRequestSchema = z.object({
  username: z.string().min(1),
});

// Login - Verify Schema
export const LoginVerifyRequestSchema = z.object({
  username: z.string().min(1),
  signature: z.object({
    r: z.string(),
    s: z.string(),
  }),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type ChallengeRequest = z.infer<typeof ChallengeRequestSchema>;
export type LoginVerifyRequest = z.infer<typeof LoginVerifyRequestSchema>;