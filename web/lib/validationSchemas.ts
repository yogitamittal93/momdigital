import { z } from 'zod';

// Auth Validation Schema
export const AuthSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(6),
});

// Posts Validation Schema
export const PostSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1),
  authorId: z.string().uuid(),
  createdAt: z.date(),
});

// Documents Validation Schema
export const DocumentSchema = z.object({
  title: z.string().min(1).max(200),
  fileUrl: z.string().url(),
  uploadedBy: z.string().uuid(),
  uploadedAt: z.date(),
});
