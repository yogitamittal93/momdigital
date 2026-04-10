"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Mail, Lock, User, Eye, EyeOff, Sparkles } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import router from "next/dist/shared/lib/router/router";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate successful login/register and navigate to home
    router.push("/");
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">

        {/* Left Side - Welcome Section with Image */}
        <div className="hidden md:flex flex-col items-center justify-center space-y-6 p-8">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Heart className="w-12 h-12 text-primary fill-primary" />
              <div className="text-left">
                <h1 className="text-3xl text-primary mb-0">MomDigital</h1>
                <p className="text-base text-muted-foreground">MidwifeBuddy</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden shadow-2xl w-full max-w-md">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1555252333-9f8e92e65df9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800"
              alt="Expecting mother feeling peaceful"
              className="w-full h-[500px] object-cover"
            />
          </div>

          <div className="text-center max-w-md space-y-3">
            <h2 className="text-xl text-foreground">Your Journey, Our Support</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Join thousands of mothers who trust MomDigital to guide them through pregnancy,
              postpartum recovery, and beyond. You're never alone on this beautiful journey.
            </p>
            <div className="flex items-center justify-center gap-6 pt-4">
              <div className="text-center">
                <div className="text-2xl mb-1 text-primary">50K+</div>
                <div className="text-xs text-muted-foreground">Happy Moms</div>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div className="text-center">
                <div className="text-2xl mb-1 text-secondary">4.9★</div>
                <div className="text-xs text-muted-foreground">App Rating</div>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div className="text-center">
                <div className="text-2xl mb-1 text-accent">24/7</div>
                <div className="text-xs text-muted-foreground">Support</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="md:hidden flex items-center justify-center gap-2 mb-8">
            <Heart className="w-8 h-8 text-primary fill-primary" />
            <div>
              <h1 className="text-xl text-primary">MomDigital</h1>
              <p className="text-xs text-muted-foreground">MidwifeBuddy</p>
            </div>
          </div>

          <Card className="bg-card/95 backdrop-blur-sm shadow-2xl border-none rounded-3xl p-8">
            {/* Tabs */}
            <div className="flex gap-2 mb-8 p-1 bg-muted/50 rounded-2xl">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 rounded-xl transition-all ${
                  isLogin
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 rounded-xl transition-all ${
                  !isLogin
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Welcome Message */}
            <div className="mb-6 text-center">
              <h2 className="text-2xl mb-2 flex items-center justify-center gap-2">
                {isLogin ? "Welcome Back!" : "Start Your Journey"}
                <Sparkles className="w-5 h-5 text-secondary" />
              </h2>
              <p className="text-sm text-muted-foreground">
                {isLogin
                  ? "We're so glad to see you again. Let's continue your journey together."
                  : "We're here to support you every step of the way. Let's get started!"}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Field - Only for Sign Up */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="pl-10 h-12 rounded-xl bg-input-background border-border/50 focus:border-primary"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10 h-12 rounded-xl bg-input-background border-border/50 focus:border-primary"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10 pr-10 h-12 rounded-xl bg-input-background border-border/50 focus:border-primary"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password - Only for Sign Up */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      className="pl-10 h-12 rounded-xl bg-input-background border-border/50 focus:border-primary"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              {/* Remember Me / Terms */}
              <div className="flex items-center justify-between">
                {isLogin ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Checkbox id="remember" />
                      <Label htmlFor="remember" className="text-sm cursor-pointer">
                        Remember me
                      </Label>
                    </div>
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </>
                ) : (
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms"
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked) => handleInputChange("agreeToTerms", !!checked)}
                      required={!isLogin}
                    />
                    <Label htmlFor="terms" className="text-xs leading-relaxed cursor-pointer text-muted-foreground">
                      I agree to the{" "}
                      <a href="#" className="text-primary hover:underline">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-primary hover:underline">
                        Privacy Policy
                      </a>
                    </Label>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
              >
                {isLogin ? "Login to Your Account" : "Create Your Account"}
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-4 text-muted-foreground">or continue with</span>
                </div>
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-xl border-border/50 hover:bg-muted"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-xl border-border/50 hover:bg-muted"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </Button>
              </div>
            </form>
          </Card>

          {/* Footer Text */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            By {isLogin ? "logging in" : "signing up"}, you agree to receive personalized care tips and updates.
            Your privacy and security are our top priorities. 💕
          </p>
        </div>
      </div>
    </div>
  );
}
