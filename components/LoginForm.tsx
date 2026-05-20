"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthCardMotion } from "@/components/AuthCardMotion";
import { FormField } from "@/components/FormField";
import { FeedbackAlert } from "@/components/ui/FeedbackAlert";
import {
  authErrorVariant,
  friendlyAuthError,
} from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/client";

export type AuthMode = "login" | "signup";

type LoginFormProps = {
  initialMode?: AuthMode;
};

const inputClass =
  "input input-bordered input-md w-full min-h-12 focus:input-primary";

export function LoginForm({ initialMode = "login" }: LoginFormProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isSignup = mode === "signup";

  function switchMode(next: AuthMode) {
    setMode(next);
    setError(null);
    setMessage(null);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      let supabase;
      try {
        supabase = createClient();
      } catch (configError) {
        setError(
          configError instanceof Error
            ? configError.message
            : "Supabase is not configured. Check .env.local and restart the dev server."
        );
        return;
      }

      if (isSignup) {
        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({ email, password });
        if (signUpError) {
          setError(friendlyAuthError(signUpError.message));
          return;
        }
        if (signUpData.session) {
          window.location.href = "/dashboard";
          return;
        }
        setMessage(
          "Account created! Check your email to confirm, then log in."
        );
        switchMode("login");
        return;
      }

      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError(friendlyAuthError(signInError.message));
        return;
      }

      if (!signInData.session) {
        setError(
          "Login did not complete. If you just signed up, confirm your email first."
        );
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCardMotion>
      <section className="card-body gap-5">
        <header className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            {isSignup ? "Create your account" : "Welcome back"}
          </h2>
          <p className="mt-1 text-sm text-base-content/70">
            {isSignup
              ? "Sign up to start logging concerts and costs."
              : "Log in to track your concert spending and fun."}
          </p>
        </header>

        <section className="flex gap-2">
          <button
            type="button"
            className={`btn btn-interactive min-h-11 flex-1 ${
              !isSignup ? "btn-primary" : "btn-outline"
            }`}
            onClick={() => switchMode("login")}
          >
            Log in
          </button>
          <button
            type="button"
            className={`btn btn-interactive min-h-11 flex-1 ${
              isSignup ? "btn-primary" : "btn-outline"
            }`}
            onClick={() => switchMode("signup")}
          >
            Sign up
          </button>
        </section>

        {error && (
          <FeedbackAlert
            variant={authErrorVariant(error)}
            message={error}
            onDismiss={() => setError(null)}
          />
        )}
        {message && (
          <FeedbackAlert variant="success" message={message} />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Email" htmlFor="email" required>
            <input
              id="email"
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </FormField>

          <FormField
            label="Password"
            htmlFor="password"
            required
            helper="At least 6 characters"
          >
            <input
              id="password"
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete={isSignup ? "new-password" : "current-password"}
            />
          </FormField>

          <button
            type="submit"
            className="btn btn-primary btn-interactive min-h-12 w-full text-base"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                Please wait...
              </>
            ) : isSignup ? (
              "Create account"
            ) : (
              "Log in"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-base-content/70">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <Link href="/login" className="link link-primary font-medium">
                Log in
              </Link>
            </>
          ) : (
            <>
              New here?{" "}
              <Link href="/signup" className="link link-primary font-medium">
                Create an account
              </Link>
            </>
          )}
        </p>
      </section>
    </AuthCardMotion>
  );
}
