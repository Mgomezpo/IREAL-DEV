import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callService } from "@/lib/service-client";

const SERVICE_ENABLED = process.env.IDEAS_SERVICE_ENABLED === "true";
const SERVICE_BASE_PATH = "/v1/ideas";

const buildQueryString = (request: NextRequest): string => {
  const params = request.nextUrl.searchParams;
  const q = params.get("q") ?? params.get("search") ?? undefined;
  const limit = params.get("limit") ?? undefined;
  const offset = params.get("offset") ?? undefined;

  const search = new URLSearchParams();
  if (q) search.set("q", q);
  if (limit) search.set("limit", limit);
  if (offset) search.set("offset", offset);

  const query = search.toString();
  return query ? `${SERVICE_BASE_PATH}?${query}` : SERVICE_BASE_PATH;
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!SERVICE_ENABLED) {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search");

    let query = supabase
      .from("ideas")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data: ideas, error } = await query;

    if (error) {
      console.error("[v0] Database error:", error);
      return NextResponse.json({ error: "Failed to fetch ideas" }, { status: 500 });
    }

    return NextResponse.json(ideas ?? []);
  }

  const response = await callService(buildQueryString(request), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": user.id,
    },
  });

  const envelope = await response.json();

  if (!response.ok) {
    return NextResponse.json(envelope, { status: response.status });
  }

  const items = (envelope?.data?.items as unknown[]) ?? [];
  const total = envelope?.data?.pagination?.total;

  return NextResponse.json(items, {
    status: response.status,
    headers: total !== undefined ? { "x-total-count": String(total) } : undefined,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!SERVICE_ENABLED) {
    const { title, content } = body;
    const { data: newIdea, error } = await supabase
      .from("ideas")
      .insert({
        user_id: user.id,
        title: title || "Sin titulo",
        content: content || "",
      })
      .select()
      .single();

    if (error) {
      console.error("[v0] Database error:", error);
      return NextResponse.json({ error: "Failed to create idea" }, { status: 500 });
    }

    return NextResponse.json(newIdea, { status: 201 });
  }

  const response = await callService(SERVICE_BASE_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": user.id,
    },
    body: JSON.stringify(body ?? {}),
  });

  const envelope = await response.json();

  if (!response.ok) {
    return NextResponse.json(envelope, { status: response.status });
  }

  return NextResponse.json(envelope.data ?? null, { status: response.status });
}
