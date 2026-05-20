import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ externalId: string }> };

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { externalId } = await params;
  const decodedId = decodeURIComponent(externalId);

  if (!decodedId) {
    return NextResponse.json({ error: "Event id is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("liked_concerts")
    .delete()
    .eq("user_id", user.id)
    .eq("external_event_id", decodedId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ removed: true, external_event_id: decodedId });
}
