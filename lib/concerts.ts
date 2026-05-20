import { createClient } from "@/lib/supabase/server";
import type { Concert } from "@/lib/database.types";

export async function getConcerts(): Promise<Concert[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("concerts")
    .select("*")
    .order("concert_date", { ascending: false });

  if (error) {
    console.error("Failed to fetch concerts:", error.message);
    return [];
  }

  return data ?? [];
}
