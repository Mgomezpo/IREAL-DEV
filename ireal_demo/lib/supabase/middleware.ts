// Edge-safe no-op middleware: Next.js middleware runs on the Edge runtime,
// and @supabase/ssr uses Node APIs that are not supported there. This stub
// avoids build failures on Vercel. Implement route protection in server
// components or API handlers instead.
import { NextResponse, type NextRequest } from "next/server"

export function updateSession(_request: NextRequest) {
  return NextResponse.next()
}
