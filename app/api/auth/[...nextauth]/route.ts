import NextAuth from "next-auth";
import { authOptions, getCanonicalBaseUrl, isProductionEnv } from "@/lib/auth";

// Enforce canonical base URL in production before NextAuth initializes
if (isProductionEnv()) {
  if (
    !process.env.NEXTAUTH_URL ||
    process.env.NEXTAUTH_URL.includes("localhost") ||
    process.env.NEXTAUTH_URL.includes("127.0.0.1") ||
    process.env.NEXTAUTH_URL.includes("0.0.0.0")
  ) {
    process.env.NEXTAUTH_URL = getCanonicalBaseUrl();
  }
}

const nextAuthHandler = NextAuth(authOptions);

async function handler(req: any, ctx: any) {
  if (isProductionEnv() && req?.headers) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || "https";
    if (host && !host.includes("localhost") && !host.includes("127.0.0.1") && !host.includes("0.0.0.0")) {
      process.env.NEXTAUTH_URL = `${proto}://${host}`;
    }
  }
  return nextAuthHandler(req, ctx);
}

export { handler as GET, handler as POST };
