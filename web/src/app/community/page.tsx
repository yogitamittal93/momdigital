"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Plus,
  Users,
  X,
  Send,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: { id: string; name: string; avatarUrl?: string | null } | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Seed data ─────────────────────────────────────────────────────────────────

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

// ─── Helpers ────────────────────────────────────────────────────────────────────

function timeAgo(date: Date) {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function isSeed(id: string) {
  return id.startsWith("seed");
}

// ─── Comment Thread ─────────────────────────────────────────────────────────────

function CommentThread({
  postId,
  currentUserId,
}: {
  postId: string;
  currentUserId: string | null;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Load comments when thread opens
  useEffect(() => {
    if (isSeed(postId)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get<Comment[]>(`/posts/${postId}/comments`)
      .then((res) =>
        setComments(
          (res.data ?? []).map((c) => ({
            ...c,
            createdAt: new Date(c.createdAt),
            updatedAt: new Date(c.updatedAt),
          }))
        )
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = text.trim();
      if (!trimmed || submitting || isSeed(postId)) return;
      setSubmitting(true);

      // Optimistic insert
      const optimistic: Comment = {
        id: `opt-${Date.now()}`,
        postId,
        authorId: currentUserId ?? "",
        author: { id: currentUserId ?? "", name: "You" },
        content: trimmed,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setComments((prev) => [...prev, optimistic]);
      setText("");

      try {
        const res = await api.post<Comment>(`/posts/${postId}/comments`, {
          content: trimmed,
        });
        const real = {
          ...res.data,
          createdAt: new Date(res.data.createdAt),
          updatedAt: new Date(res.data.updatedAt),
        };
        // Replace optimistic with real comment
        setComments((prev) =>
          prev.map((c) => (c.id === optimistic.id ? real : c))
        );
      } catch {
        // Rollback
        setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
        setText(trimmed);
      } finally {
        setSubmitting(false);
      }
    },
    [text, submitting, postId, currentUserId]
  );

  const handleDelete = useCallback(
    async (commentId: string) => {
      // Optimistic remove
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      try {
        await api.delete(`/posts/${postId}/comments/${commentId}`);
      } catch {
        // No rollback needed — just inform via console
        console.warn("Failed to delete comment", commentId);
      }
    },
    [postId]
  );

  return (
    <div className="mt-3 border-t border-border/50 pt-3 space-y-3">
      {/* Comment list */}
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          Loading replies…
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground py-1">
          No replies yet — be the first!
        </p>
      ) : (
        <div className="space-y-2.5">
          {comments.map((comment) => {
            const name = comment.author?.name ?? "Member";
            const isOwn = comment.authorId === currentUserId;
            return (
              <div key={comment.id} className="flex gap-2 group">
                <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                  <AvatarFallback className="text-[10px] font-semibold">
                    {initials(name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="bg-muted/50 rounded-2xl px-3 py-2 inline-block max-w-full">
                    <p className="text-xs font-semibold leading-tight mb-0.5">{name}</p>
                    <p className="text-sm leading-snug break-words">{comment.content}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">
                    {timeAgo(comment.createdAt)}
                  </p>
                </div>
                {isOwn && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1 p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    title="Delete comment"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reply input */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <Avatar className="w-7 h-7 shrink-0">
          <AvatarFallback className="text-[10px] font-semibold">You</AvatarFallback>
        </Avatar>
        <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1.5">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isSeed(postId) ? "Login to reply…" : "Write a reply…"}
            disabled={isSeed(postId) || submitting}
            maxLength={1000}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!text.trim() || submitting || isSeed(postId)}
            className="text-primary disabled:opacity-40 hover:text-primary/80 transition-colors"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Post Card ─────────────────────────────────────────────────────────────────

function PostCard({
  post,
  currentUserId,
}: {
  post: Post;
  currentUserId: string | null;
}) {
  const [likes, setLikes] = useState(post.likes ?? 0);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const handleLike = useCallback(async () => {
    if (liking || isSeed(post.id)) return;
    const prevLiked = liked;
    const prev = likes;
    setLiked((l) => !l);
    setLikes((n) => (prevLiked ? n - 1 : n + 1));
    setLiking(true);
    try {
      await api.post(`/posts/${post.id}/like`);
    } catch {
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
      {/* Author row */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar>
          <AvatarFallback className="text-xs font-semibold">
            {initials(authorName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-tight">{authorName}</p>
          <p className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</p>
        </div>
        {post.category && (
          <Badge variant="secondary" className="shrink-0 text-xs">
            {post.category}
          </Badge>
        )}
      </div>

      {/* Content */}
      <p className="text-sm leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>

      {/* Actions */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        {/* Like */}
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

        {/* Toggle comments */}
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 hover:bg-muted transition-colors cursor-pointer"
          aria-expanded={showComments}
          aria-label="Toggle replies"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{showComments ? "Hide" : "Reply"}</span>
          {showComments ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* Inline comment thread */}
      {showComments && (
        <CommentThread postId={post.id} currentUserId={currentUserId} />
      )}
    </Card>
  );
}

// ─── Add Post Modal ─────────────────────────────────────────────────────────────

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
              placeholder="Share your experience, ask a question, or offer support…"
              rows={5}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-between mt-1">
              {errors.content ? (
                <p className="text-xs text-destructive">{errors.content.message}</p>
              ) : (
                <span />
              )}
              <span
                className={[
                  "text-xs tabular-nums",
                  content.length > 1900 ? "text-destructive" : "text-muted-foreground",
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

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>(SEED_POSTS);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // We'll try to get the current user id from the API's /auth/me or profile
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch current user id once
  useEffect(() => {
    api
      .get<{ user?: { id: string }; id?: string }>("/auth/me")
      .then((res) =>
        setCurrentUserId(res.data?.user?.id ?? res.data?.id ?? null),
      )
      .catch(() => {});
  }, []);

  // Fetch posts
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
      .catch(() => {})
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
                <div key={i} className="h-40 rounded-3xl bg-muted animate-pulse" />
              ))}
            </div>
          )}

          {!loading &&
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
              />
            ))}
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
