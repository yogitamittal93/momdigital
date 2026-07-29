"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { loginUser, signupUser, clearAuthCookies } from "@/services/auth.service";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { getApiBase } from "@/lib/api-url";
import { bumpAuthEpoch } from "@/lib/api-client";

// ── Schemas ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signupSchema = z
  .object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string(),
    agreeToTerms: z.literal(true),
    dueDate: z.string().optional(),
    babyBirthDate: z.string().optional(),
  })
  .refine((d) => Boolean(d.dueDate || d.babyBirthDate), {
    path: ["dueDate"],
    message: "Please provide due date or baby birth date",
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

// ── OAuth buttons ─────────────────────────────────────────────────────────────

function OAuthButtons() {
  // Strip a trailing "/api" only — using .replace("/api", "") here previously
  // matched the FIRST "/api" substring anywhere in the URL, which incorrectly
  // ate the "//" right after "https:" when the hostname itself starts with
  // "api-..." (e.g. https://api-production-...up.railway.app/api became
  // https:/-production-...up.railway.app/api). Anchoring to the end with
  // a regex fixes this.
  const apiBase = getApiBase().replace(/\/api\/?$/, ""); // e.g. http://localhost:3001

  return (
    <div className="space-y-3">
      {/* Google */}
      <a
        href={`${apiBase}/api/auth/google`}
        className="flex items-center justify-center gap-3 w-full border border-border rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        {/* Google SVG logo */}
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
          <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
        </svg>
        Continue with Google
      </a>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs text-muted-foreground">
          <span className="bg-background px-2">or continue with email</span>
        </div>
      </div>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

interface AuthFormValues {
  email: string;
  password: string;
  name?: string;
  confirmPassword?: string;
  agreeToTerms?: boolean;
  dueDate?: string;
  babyBirthDate?: string;
}

export default function AuthForm({ type }: { type: "login" | "register" }) {
  const isLoginMode = type === "login";
  const [isLogin, setIsLogin] = useState(isLoginMode);
  const [loading, setLoading] = useState(false);

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(isLogin ? loginSchema : signupSchema),
    defaultValues: {
      email: "", password: "", name: "", confirmPassword: "",
      agreeToTerms: false, dueDate: "", babyBirthDate: "",
    },
  });

  useEffect(() => { form.reset(); }, [isLogin, form]);

  // Wipe stale/duplicate auth cookies as soon as the login page opens so a
  // normal Chrome profile cannot send leftover Domain= / SameSite siblings.
  useEffect(() => {
    void clearAuthCookies().catch(() => {
      // Best-effort — login can still overwrite host-only cookies.
    });
  }, []);

  const onSubmit = async (data: AuthFormValues) => {
    try {
      setLoading(true);
      // Clear again immediately before login so Set-Cookie on login is the
      // only session pair left in the jar for api.momdigital.live.
      await clearAuthCookies().catch(() => undefined);
      if (isLogin) {
        await loginUser({ email: data.email, password: data.password });
      } else {
        await signupUser({
          name: data.name ?? "", email: data.email, password: data.password,
          dueDate: data.dueDate || undefined,
          babyBirthDate: data.babyBirthDate || undefined,
        });
      }
      // Invalidate any in-flight pre-login /me→refresh handlers, then full
      // reload so UserProfileProvider remounts with the new session cookies.
      bumpAuthEpoch();
      window.location.href = "/dashboard";
    } catch (error: unknown) {
      const err = error as { message?: string; response?: { data?: { message?: string } } };
      form.setError("root", {
        message: err.message || err.response?.data?.message || "Something went wrong",
      });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <OAuthButtons />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {!isLogin && (
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          )}

          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input {...field} type="email" autoComplete="email" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl><Input {...field} type="password" autoComplete={isLogin ? "current-password" : "new-password"} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {!isLogin && (
            <>
              <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl><Input {...field} type="password" autoComplete="new-password" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField control={form.control} name="dueDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due date (if pregnant)</FormLabel>
                    <FormControl><Input {...field} type="date" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="babyBirthDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Baby birth date (if postpartum)</FormLabel>
                    <FormControl><Input {...field} type="date" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="agreeToTerms" render={({ field }) => (
                <FormItem>
                  <div className="flex gap-2 items-center">
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    <FormLabel className="cursor-pointer text-xs sm:text-sm">
                      I accept the{" "}
                      <Link href="/terms" className="underline hover:text-primary transition-colors">
                        terms of service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="underline hover:text-primary transition-colors">
                        privacy policy
                      </Link>
                    </FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
            </>
          )}

          {form.formState.errors.root && (
            <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
          )}

          <Button type="submit" className="w-full rounded-full" disabled={loading}>
            {loading ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            {isLogin ? (
              <p>No account? <button type="button" onClick={() => setIsLogin(false)} className="text-primary font-medium hover:underline">Sign up</button></p>
            ) : (
              <p>Already registered? <button type="button" onClick={() => setIsLogin(true)} className="text-primary font-medium hover:underline">Sign in</button></p>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
