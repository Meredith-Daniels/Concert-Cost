import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { AppProviders } from "@/components/providers/AppProviders";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell userEmail={user.email ?? "Your account"}>
      <AppProviders>{children}</AppProviders>
    </AppShell>
  );
}
