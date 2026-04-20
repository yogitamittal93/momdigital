import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const postSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  authorId: z.string(),
  likes: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Post = z.infer<typeof postSchema>;

export const postsResponseSchema = z.array(postSchema);

export type PostsResponse = z.infer<typeof postsResponseSchema>;

export const likePostSchema = z.object({
  postId: z.string(),
});

export type LikePostInput = z.infer<typeof likePostSchema>;