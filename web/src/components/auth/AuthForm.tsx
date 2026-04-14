"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { loginUser, signupUser } from "@/services/auth.service";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "../ui/form";

import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";

/* ================= SCHEMAS ================= */

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

export default function AuthForm({ type }: { type: "login" | "register" }) {
  const isLoginMode = type === "login";
  const [isLogin, setIsLogin] = useState(isLoginMode);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const form = useForm<any>({
    resolver: zodResolver(isLogin ? loginSchema : signupSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      confirmPassword: "",
      agreeToTerms: false,
      dueDate: "",
      babyBirthDate: "",
    },
  });

  useEffect(() => {
    form.reset();
  }, [isLogin]);

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);

      if (isLogin) {
        await loginUser({
          email: data.email,
          password: data.password,
        });
      } else {
        await signupUser({
          name: data.name,
          email: data.email,
          password: data.password,
          dueDate: data.dueDate || undefined,
          babyBirthDate: data.babyBirthDate || undefined,
        });
      }

      router.push("/dashboard");
    } catch (error: any) {
      form.setError("root", {
        message:
          error.response?.data?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        {!isLogin && (
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input {...field} type="password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isLogin && (
          <>
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date (if pregnant)</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="babyBirthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Baby Birth Date (if postpartum)</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="agreeToTerms"
              render={({ field }) => (
                <FormItem>
                  <div className="flex gap-2">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <FormLabel>Accept Terms</FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {form.formState.errors.root && (
          <p className="text-red-500 text-sm">
            {form.formState.errors.root.message}
          </p>
        )}

        <Button disabled={loading}>
          {loading ? "Loading..." : isLogin ? "Login" : "Signup"}
        </Button>
        <div className="text-center mt-4 text-sm">
          {isLogin ? (
            <p>
              Don't have an account?{" "}
              <Link href="/register" className="text-primary font-medium">
                Sign up
              </Link>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-medium">
                Login
              </Link>
            </p>
          )}
        </div>
        
      </form>
    </Form>
  );
}