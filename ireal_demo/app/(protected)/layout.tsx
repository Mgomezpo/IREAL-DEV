import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  return <>{children}</>
}
