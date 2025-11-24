import { z } from 'zod';

export const AddContactRequestSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(32, 'Username must be at most 32 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only alphanumeric and underscore are allowed'),
});

export type AddContactRequest = z.infer<typeof AddContactRequestSchema>;
