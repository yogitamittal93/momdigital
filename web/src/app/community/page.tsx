"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Heart, MessageCircle, Plus, Users, X, Send, Loader2 } from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createPostSchema,
  CreatePostInput,
  POST_CATEGORIES,
  Post,
} from "../../../lib/post-schemas";
import api from "@/lib/api";

// ─── Seed data (shown when API has no posts / is unavailable) ─────────────────
const SEED_POSTS: Post[] = [
  {
    id: "seed-1",
    content:
      "Prenatal yoga has been a game-changer for my third-trimester back pain. 10/10 recommend for anyone feeling overwhelmed!",
    category: "Wellness",
    authorId: "seed",
    author: { id: "seed", name: "Emma Rodriguez" },
    likes: 234,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: "seed-2",
    content:
      "Just had my 28-week scan — everything looks perfect! The OB said baby is in the 65th percentile. Feeling so grateful 💕",
    category: "Pregnancy",
    authorId: "seed2",
    author: { id: "seed2", name: "Priya Sharma" },
    likes: 87,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: Date) {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ post }: { post: Post }) {
  const [likes, setLikes] = useState(post.likes ?? 0);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  const handleLike = useCallback(async () => {
    if (liking || post.id.startsWith("seed")) return;

    // Optimistic update
    const prev = likes;
    const prevLiked = liked;
    setLiked((l) => !l);
    setLikes((n: number) => (prevLiked ? n - 1 : n + 1));
    setLiking(true);

    try {
      await api.post(`/posts/${post.id}/like`);
    } catch {
      // Rollback on failure
      setLiked(prevLiked);
      setLikes(prev);
    } finally {
      setLiking(false);
    }
  }, [likes, liked, liking, post.id]);

  const authorName = post.author?.name ?? "Community Member";

  return (
    <Card
      data-testid="post-item"
      className="rounded-3xl border-none shadow-lg p-5 hover:shadow-xl transition-shadow duration-200"
    >
      <div className="flex items-start gap-3 mb-3">
        <Avatar>
          <AvatarFallback className="text-xs font-semibold">
            {initials(authorName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-tight">{authorName}</p>
          <p className="text-xs text-muted-foreground">
            {timeAgo(post.createdAt)}
          </p>
        </div>
        {post.category && (
          <Badge variant="secondary" className="shrink-0 text-xs">
            {post.category}
          </Badge>
        )}
      </div>

      <p className="text-sm leading-relaxed mb-4 whitespace-pre-wrap">
        {post.content}
      </p>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        {/* Like Button — Optimistic UI */}
        <button
          data-testid="like-button"
          onClick={handleLike}
          disabled={liking}
          aria-label={`Like post, ${likes} likes`}
          className={[
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all duration-150",
            "hover:bg-primary/10 active:scale-95",
            liked ? "text-primary font-medium" : "text-muted-foreground",
            liking ? "opacity-50 cursor-wait" : "cursor-pointer",
          ].join(" ")}
        >
          <Heart className="w-4 h-4" fill={liked ? "currentColor" : "none"} />
          <span>{likes}</span>
        </button>

        <span className="flex items-center gap-1">
          <MessageCircle className="w-4 h-4" />
          Reply
        </span>
      </div>
    </Card>
  );
}

// ─── Add Post Modal ───────────────────────────────────────────────────────────

interface AddPostModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (post: Post) => void;
}

function AddPostModal({ open, onClose, onCreated }: AddPostModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { content: "", category: undefined },
  });

  const content = watch("content") ?? "";

  // Sync native <dialog> open/close with React state
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const onSubmit = async (data: CreatePostInput) => {
    try {
      const res = await api.post<Post>("/posts", data);
      const created = res.data;
      onCreated({
        ...created,
        createdAt: new Date(created.createdAt),
        updatedAt: new Date(created.updatedAt),
        likes: 0,
      });
      reset();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to create post. Please try again.";
      alert(msg);
    }
  };

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-post-title"
      onClose={onClose}
      style={{ maxWidth: "min(90vw, 520px)" }}
      className="fixed inset-0 z-50 m-auto w-full rounded-3xl border-none bg-card shadow-2xl p-0 backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 id="add-post-title" className="text-lg font-semibold">
            Share with the Community
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full p-1.5 hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Category */}
          <div>
            <label
              htmlFor="post-category"
              className="block text-xs font-medium text-muted-foreground mb-1.5"
            >
              Category (optional)
            </label>
            <select
              id="post-category"
              {...register("category")}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">— Choose a topic —</option>
              {POST_CATEGORIES.map((cat: string) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div>
            <label
              htmlFor="post-content"
              className="block text-xs font-medium text-muted-foreground mb-1.5"
            >
              Your message
            </label>
            <textarea
              id="post-content"
              {...register("content")}
              name="content"
              placeholder="Share your experience, ask a question, or offer support…"
              rows={5}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-between mt-1">
              {errors.content ? (
                <p className="text-xs text-destructive">
                  {errors.content.message}
                </p>
              ) : (
                <span />
              )}
              <span
                className={[
                  "text-xs tabular-nums",
                  content.length > 1900
                    ? "text-destructive"
                    : "text-muted-foreground",
                ].join(" ")}
              >
                {content.length}/2000
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 rounded-full"
              id="submit-post-btn"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isSubmitting ? "Posting…" : "Post"}
            </Button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>(SEED_POSTS);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get<Post[]>("/posts", { params: { page: 1, limit: 20 } })
      .then((res) => {
        const fetched = (res.data ?? []).map((p) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        }));
        if (fetched.length > 0) setPosts(fetched);
      })
      .catch(() => {
        /* Keep seed data on network failure */
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePostCreated = useCallback((newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  }, []);

  return (
    <AppShell>
      <div className="min-h-screen bg-background pb-8">
        {/* Header */}
        <div className="bg-gradient-to-br from-chart-5/30 via-chart-5/20 to-background px-4 md:px-8 pt-8 pb-8 rounded-b-[3rem]">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl mb-2">Community</h1>
                <p className="text-muted-foreground">
                  Connect, share, and support each other
                </p>
              </div>
              <Button
                id="add-post-btn"
                onClick={() => setModalOpen(true)}
                className="rounded-full bg-chart-5 hover:bg-chart-5/90 text-foreground gap-2"
                aria-label="Create new post"
              >
                <Plus className="w-5 h-5" />
                Post
              </Button>
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-4 space-y-6">
          <Card className="rounded-3xl border-none shadow-lg p-6 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-primary shrink-0" />
              <div>
                <h3>Community Impact</h3>
                <p className="text-sm text-muted-foreground">
                  {loading
                    ? "Loading community posts…"
                    : `${posts.length} posts · 15.2K moms sharing practical support.`}
                </p>
              </div>
            </div>
          </Card>

          {loading && (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-40 rounded-3xl bg-muted animate-pulse"
                />
              ))}
            </div>
          )}

          {!loading &&
            posts.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      </div>

      <AddPostModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handlePostCreated}
      />
    </AppShell>
  );
}
