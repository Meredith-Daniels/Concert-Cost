import { redirect } from "next/navigation";
import { Music } from "lucide-react";
import { LoginForm } from "@/components/LoginForm";
import { ThemeSelector } from "@/components/ThemeSelector";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

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
              Remember every show.
              <br />
              <span className="text-primary">Know what it was worth.</span>
            </h1>
            <p className="mt-4 text-base text-base-content/70 sm:text-lg">
              Log the concerts you attend, track every cost, rate the fun, and
              see which shows gave you the best bang for your buck.
            </p>
          </section>

          <LoginForm initialMode="login" />
        </section>
      </section>
    </section>
  );
}
