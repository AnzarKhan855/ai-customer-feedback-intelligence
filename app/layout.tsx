import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: "LOOP — AI Customer-Feedback Intelligence Platform",
  description:
    "Multi-tenant feedback intelligence engine that ingests, classifies, clusters, and grounds customer feedback into actionable insights.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
