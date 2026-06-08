"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Heart, MessageCircle, Plus, Users, X, Send, Loader2,
  Trash2, Bookmark, Share2, Sparkles, ChefHat, Baby,
  Leaf, Brain, Dumbbell, MoreHorizontal,
} from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useUserProfile } from "@/hooks/use-user-profile";
import { api } from "@/lib/api-client";
import {
  createPostSchema,
  type CreatePostInput,
  POST_CATEGORIES,
  type Post,
} from "@/lib/post-schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// ── Category config ───────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string; emoji: string }> = {
  Pregnancy:      { icon: <Sparkles className="w-3.5 h-3.5" />, color: "bg-primary/15 text-primary border-primary/20", emoji: "🤰" },
  Postpartum:     { icon: <Heart className="w-3.5 h-3.5" />, color: "bg-rose-500/15 text-rose-600 border-rose-200", emoji: "💗" },
  Wellness:       { icon: <Leaf className="w-3.5 h-3.5" />, color: "bg-emerald-500/15 text-emerald-700 border-emerald-200", emoji: "🌿" },
  Nutrition:      { icon: <ChefHat className="w-3.5 h-3.5" />, color: "bg-amber-500/15 text-amber-700 border-amber-200", emoji: "🥗" },
  "Mental Health":{ icon: <Brain className="w-3.5 h-3.5" />, color: "bg-violet-500/15 text-violet-700 border-violet-200", emoji: "🧠" },
  "Baby Care":    { icon: <Baby className="w-3.5 h-3.5" />, color: "bg-sky-500/15 text-sky-700 border-sky-200", emoji: "👶" },
  Fitness:        { icon: <Dumbbell className="w-3.5 h-3.5" />, color: "bg-orange-500/15 text-orange-700 border-orange-200", emoji: "💪" },
  General:        { icon: <Users className="w-3.5 h-3.5" />, color: "bg-muted text-muted-foreground border-border", emoji: "💬" },
};

function CategoryBadge({ category }: { category?: string | null }) {
  if (!category) return null;
  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.General;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      {cfg.icon}{category}
    </span>
  );
}

function timeAgo(date: Date | string): string {
  const d = new Date(date);
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function initials(name?: string): string {
  if (!name) return "M";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// ── Seed posts (shown before API loads) ──────────────────────────────────────

const SEED_POSTS: Post[] = [
  {
    id: "seed-1",
    content: "My lactation consultant suggested skin-to-skin contact for at least 1 hour after birth. It made such a difference for our breastfeeding journey. For all the new mamas — don't give up in the first 2 weeks, it DOES get easier! 🤱",
    category: "Postpartum",
    authorId: "seed",
    author: { id: "seed", name: "Priya Sharma" },
    likes: 247,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: "seed-2",
    content: "Recipe that saved my postpartum energy: Methi ladoo with gond, desi ghee, and dry fruits. My mom's recipe. DM me if you want it! Also helps with back pain according to my Ayurvedic doctor. 🫶",
    category: "Nutrition",
    authorId: "seed2",
    author: { id: "seed2", name: "Kavitha Nair" },
    likes: 183,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: "seed-3",
    content: "Week 32 and baby girl is already head-down! Doctor said everything looks perfect 💕 The third trimester exhaustion is REAL but counting down the days. Anyone else feeling emotional about meeting their little one?",
    category: "Pregnancy",
    authorId: "seed3",
    author: { id: "seed3", name: "Ananya Roy" },
    likes: 129,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
];

// ── Comment section ───────────────────────────────────────────────────────────

interface CommentData {
  id: string;
  content: string;
  author?: { name?: string };
  createdAt: string | Date;
}

function CommentSection({ postId, currentUserId }: { postId: string; currentUserId: string | null }) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) return;
    api.get(`/posts/${postId}/comments`)
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [postId, loaded]);

  const submit = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const c = await api.post(`/posts/${postId}/comments`, { content: text.trim() }) as CommentData;
      setComments((prev) => [...prev, c]);
      setText("");
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  if (!loaded) {
    return (
      <button onClick={() => setLoaded(true)} className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-1">
        View comments
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {comments.map((c) => (
        <div key={c.id} className="flex gap-2 text-sm">
          <Avatar className="w-6 h-6 flex-shrink-0">
            <AvatarFallback className="text-[10px]">{initials(c.author?.name)}</AvatarFallback>
          </Avatar>
          <div className="bg-muted/40 rounded-2xl px-3 py-1.5 flex-1">
            <span className="font-medium text-xs mr-1.5">{c.author?.name ?? "Member"}</span>
            <span className="text-muted-foreground">{c.content}</span>
          </div>
        </div>
      ))}
      {currentUserId && (
        <div className="flex gap-2 mt-2">
          <Textarea
            placeholder="Write a comment…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-0 h-9 py-2 text-sm rounded-2xl resize-none"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }}}
          />
          <Button size="sm" className="rounded-full px-3 h-9" onClick={submit} disabled={sending || !text.trim()}>
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Post card ─────────────────────────────────────────────────────────────────

function PostCard({ post, currentUserId, onDelete }: {
  post: Post;
  currentUserId: string | null;
  onDelete: (id: string) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const isOwner = currentUserId === post.authorId;

  const handleLike = async () => {
    setLiked(!liked);
    setLikeCount((n) => liked ? n - 1 : n + 1);
    try {
      await api.post(`/posts/${post.id}/like`, {});
    } catch {
      setLiked(liked);
      setLikeCount((n) => liked ? n + 1 : n - 1);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/posts/${post.id}`);
      onDelete(post.id);
    } catch { /* silent */ }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ text: post.content, url: window.location.href });
    } else {
      navigator.clipboard.writeText(post.content);
    }
  };

  return (
    <Card className="rounded-3xl border-none shadow-lg p-5">
      {/* Author row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {initials(post.author?.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{post.author?.name ?? "Community member"}</p>
            <p className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.category && <CategoryBadge category={post.category} />}
          {isOwner && (
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="p-1 rounded-full hover:bg-muted/50 transition-colors">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-8 bg-background border border-border rounded-2xl shadow-lg py-1 z-10 min-w-32">
                  <button
                    onClick={() => { handleDelete(); setShowMenu(false); }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-muted/50 w-full"
                  >
                    <Trash2 className="w-3.5 h-3.5" />Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-sm leading-relaxed mb-4">{post.content}</p>

      {/* Actions */}
      <div className="flex items-center gap-1 pt-2 border-t border-border/50">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-all ${
            liked ? "text-rose-500 bg-rose-50 dark:bg-rose-950/30" : "text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          }`}
        >
          <Heart className={`w-4 h-4 ${liked ? "fill-rose-500" : ""}`} />
          <span>{likeCount > 0 ? likeCount : ""}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="sr-only">Comment</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
        >
          <Share2 className="w-4 h-4" />
          <span className="sr-only">Share</span>
        </button>

        <button
          onClick={() => setSaved(!saved)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-all ml-auto ${
            saved ? "text-primary" : "text-muted-foreground hover:text-primary hover:bg-primary/10"
          }`}
        >
          <Bookmark className={`w-4 h-4 ${saved ? "fill-primary" : ""}`} />
          <span className="sr-only">Save</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <CommentSection postId={post.id} currentUserId={currentUserId} />
      )}
    </Card>
  );
}

// ── Compose modal ─────────────────────────────────────────────────────────────

function ComposeModal({ open, onClose, onCreated }: {
  open: boolean;
  onClose: () => void;
  onCreated: (post: Post) => void;
}) {
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
  });
  const content = watch("content", "");
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) { el.showModal(); reset(); }
    else el.close();
  }, [open, reset]);

  const onSubmit = async (data: CreatePostInput) => {
    try {
      const post = await api.post("/posts", data) as Post;
      onCreated({
        ...post,
        createdAt: new Date(post.createdAt),
        updatedAt: new Date(post.updatedAt),
        likes: 0,
      });
      onClose();
    } catch {
      // silent
    }
  };

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 z-50 m-auto w-full max-w-lg rounded-3xl bg-background p-6 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-medium">Share with the community</h2>
        <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <select
            {...register("category")}
            className="w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Choose a topic…</option>
            {POST_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{CATEGORY_CONFIG[cat]?.emoji} {cat}</option>
            ))}
          </select>
        </div>

        <div>
          <Textarea
            {...register("content")}
            placeholder="Share a tip, ask a question, or offer support to another mama…"
            className="min-h-32 rounded-2xl resize-none text-sm"
          />
          <div className="flex justify-between mt-1">
            {errors.content ? (
              <p className="text-xs text-destructive">{errors.content.message}</p>
            ) : <span />}
            <span className={`text-xs tabular-nums ${content.length > 1900 ? "text-destructive" : "text-muted-foreground"}`}>
              {content.length}/2000
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="rounded-full gap-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isSubmitting ? "Posting…" : "Post"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const { user } = useUserProfile();
  const [posts, setPosts] = useState<Post[]>(SEED_POSTS);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    api.get("/auth/me")
      .then((data: unknown) => {
        const d = data as { user?: { id: string }; id?: string };
        setCurrentUserId(d?.user?.id ?? d?.id ?? null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get("/posts?page=1&limit=20")
      .then((data: unknown) => {
        const fetched = Array.isArray(data) ? data : [];
        if (fetched.length > 0) {
          setPosts(fetched.map((p: Post) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePostCreated = useCallback((newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const filters = ["All", ...POST_CATEGORIES];
  const filtered = activeFilter === "All" ? posts : posts.filter((p) => p.category === activeFilter);

  return (
    <AppShell>
      <div className="min-h-screen bg-background pb-8">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/20 via-secondary/10 to-background px-4 md:px-8 pt-8 pb-6 rounded-b-[3rem]">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-2xl md:text-3xl mb-1">Community</h1>
                <p className="text-sm text-muted-foreground">For mothers, by mothers</p>
              </div>
              <Button
                onClick={() => setModalOpen(true)}
                className="rounded-full gap-2 shadow-lg"
              >
                <Plus className="w-4 h-4" />Post
              </Button>
            </div>

            {/* Quick compose bar */}
            {user && (
              <button
                onClick={() => setModalOpen(true)}
                className="w-full mt-3 flex items-center gap-3 bg-background/80 backdrop-blur-sm border border-border/50 rounded-2xl px-4 py-3 text-left hover:border-primary/40 transition-colors shadow-sm"
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {initials(user.name as string)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">Share something with the community…</span>
              </button>
            )}
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 md:px-8 -mt-2">
          {/* Category filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 pt-4 scrollbar-hide">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeFilter === f
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {f !== "All" && CATEGORY_CONFIG[f]?.emoji} {f}
              </button>
            ))}
          </div>

          {/* Feed */}
          <div className="mt-4 space-y-4">
            {loading && (
              <>
                {[1, 2].map((i) => (
                  <div key={i} className="h-40 rounded-3xl bg-muted/60 animate-pulse" />
                ))}
              </>
            )}

            {!loading && filtered.length === 0 && (
              <Card className="rounded-3xl border-none shadow-lg p-8 text-center">
                <p className="text-muted-foreground mb-3">No posts in {activeFilter} yet.</p>
                <Button onClick={() => setModalOpen(true)} variant="outline" className="rounded-full">
                  Be the first to post
                </Button>
              </Card>
            )}

            {!loading && filtered.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      </div>

      <ComposeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handlePostCreated}
      />
    </AppShell>
  );
}
