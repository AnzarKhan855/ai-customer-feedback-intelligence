import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Enforce production URL in middleware edge runtime
if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
  if (
    !process.env.NEXTAUTH_URL ||
    process.env.NEXTAUTH_URL.includes("localhost") ||
    process.env.NEXTAUTH_URL.includes("127.0.0.1") ||
    process.env.NEXTAUTH_URL.includes("0.0.0.0")
  ) {
    process.env.NEXTAUTH_URL =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://ai-customer-feedback-intelligence-black.vercel.app");
  }
}

export default withAuth(
  function middleware(req) {
    const response = NextResponse.next();
    const requestId =
      req.headers.get("x-request-id") ||
      `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    response.headers.set("x-request-id", requestId);
    return response;
  },
  {
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/inbox/:path*",
    "/trends/:path*",
    "/ask/:path*",
    "/reports/:path*",
    "/roadmap/:path*",
    "/datasets/:path*",
    "/alerts/:path*",
    "/settings/:path*",
    "/pm/:path*",
    "/admin/:path*",
  ],
};
