import { z } from 'zod';

export const uploadDocumentSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  size: z.number().positive('File size must be positive').max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  mimeType: z.string().regex(/^[a-z0-9]+\/[a-z0-9\-\+]+$/i, 'Invalid MIME type'),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;

export const documentSchema = z.object({
  id: z.string(),
  filename: z.string(),
  url: z.string().url(),
  size: z.number(),
  mimeType: z.string(),
  uploadedBy: z.string(),
  createdAt: z.date(),
});

export type Document = z.infer<typeof documentSchema>;

export const uploadResponseSchema = z.object({
  message: z.string(),
  document: documentSchema,
});

export type UploadResponse = z.infer<typeof uploadResponseSchema>;