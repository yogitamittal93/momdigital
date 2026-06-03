import { z } from 'zod';

// ─── Post Categories ──────────────────────────────────────────────────────────

export const POST_CATEGORIES = [
  'Pregnancy',
  'Postpartum',
  'Wellness',
  'Nutrition',
  'Mental Health',
  'Baby Care',
  'General',
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

// ─── Create Post ──────────────────────────────────────────────────────────────
// Aligned with backend DTO: { content, category } — no `title` field.

export const createPostSchema = z.object({
  content: z
    .string()
    .min(1, 'Post content is required')
    .max(2000, 'Post must be under 2000 characters'),
  category: z.enum(POST_CATEGORIES).optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

// ─── Post (API response shape) ────────────────────────────────────────────────
// Dates come back as ISO strings from JSON; coerce them to Date objects.

export const postSchema = z.object({
  id: z.string(),
  content: z.string(),
  category: z.string().nullable().optional(),
  authorId: z.string(),
  author: z
    .object({
      id: z.string(),
      name: z.string(),
      avatarUrl: z.string().nullable().optional(),
    })
    .optional(),
  _count: z
    .object({ likes: z.number() })
    .optional(),
  likes: z.number().default(0),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Post = z.infer<typeof postSchema>;

export const postsResponseSchema = z.array(postSchema);

export type PostsResponse = z.infer<typeof postsResponseSchema>;

// ─── Like Post ────────────────────────────────────────────────────────────────

export const likePostSchema = z.object({
  postId: z.string().uuid('Post ID must be a valid UUID'),
});

export type LikePostInput = z.infer<typeof likePostSchema>;