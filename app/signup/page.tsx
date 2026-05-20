import { Music } from "lucide-react";
import { LoginForm } from "@/components/LoginForm";
import { ThemeSelector } from "@/components/ThemeSelector";

export default function SignupPage() {
  return (
    <section className="hero-gradient relative flex min-h-screen flex-col">
      <section className="pointer-events-auto absolute right-4 top-4 z-50 sm:right-8 sm:top-8">
        <ThemeSelector />
      </section>

      <section className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <section className="flex w-full max-w-5xl flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-between">
          <section className="max-w-lg animate-fade-in-up text-center lg:text-left">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Music className="h-5 w-5" aria-hidden />
              Concert Cost Tracker
            </span>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Start tracking your shows
            </h1>
            <p className="mt-4 text-base text-base-content/70 sm:text-lg">
              Create a free account to log concerts, costs, and fun ratings.
            </p>
          </section>

          <LoginForm initialMode="signup" />
        </section>
      </section>
    </section>
  );
}
