import type React from "react"
import type { Metadata } from "next"
import { Playfair_Display, Inter } from "next/font/google"
import "./globals.css"
import { NavigationRoot } from "@/components/navigation-root"

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "IREAL - El workspace mágico para Magos del Contenido",
  description: "Cuaderno mágico para creadores de contenido",
  generator: "v0.app",
  icons: [
    { rel: "icon", url: "/logos/Sombrero2.png" },
    { rel: "apple-touch-icon", url: "/logos/Sombrero2.png" },
  ],
  themeColor: "#fdf6eb",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${playfair.variable} ${inter.variable} antialiased`}>
      <body className="bg-[var(--surface)] text-[var(--ink)]">
        <NavigationRoot>{children}</NavigationRoot>
      </body>
    </html>
  )
}
