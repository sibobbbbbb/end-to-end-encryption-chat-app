import { z } from 'zod';

export const SendMessageRequestSchema = z.object({
  sender_username: z.string().min(1),
  receiver_username: z.string().min(1),
  encrypted_message: z.string().min(1),
  message_hash: z.string().min(1),
  signature: z.object({
    r: z.string(),
    s: z.string(),
  }),
  timestamp: z.iso.datetime({ offset: true })
});

export const GetMessagesQuerySchema = z.object({
  partner: z.string().min(1),
  since: z.string().optional(),
});

export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;
export type GetMessagesQuery = z.infer<typeof GetMessagesQuerySchema>;