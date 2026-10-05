import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

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
  ],
};
