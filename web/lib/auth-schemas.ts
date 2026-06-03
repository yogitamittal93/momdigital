import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: z.string().min(1, 'Name is required'),
  dueDate: z.date().optional(),
  babyBirthDate: z.date().optional(),
}).refine(
  (data) => data.dueDate || data.babyBirthDate,
  {
    message: 'Either due date or baby birth date must be provided',
    path: ['dueDate'],
  }
);

export type RegisterInput = z.infer<typeof registerSchema>;

export const authResponseSchema = z.object({
  message: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    dueDate: z.date().optional(),
    babyBirthDate: z.date().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
  token: z.string().optional(),
  access_token: z.string().optional(),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;