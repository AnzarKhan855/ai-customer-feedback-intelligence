import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const CANONICAL_PRODUCTION_URL = "https://ai-customer-feedback-intelligence-black.vercel.app";

/**
 * Returns true if the environment is a production or cloud environment (Vercel, Railway, etc.).
 */
export function isProductionEnv(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "development")
  );
}

/**
 * Resolves the canonical, trusted base URL for production and development.
 * Strictly guarantees that production never falls back to or returns localhost.
 */
export function getCanonicalBaseUrl(fallbackBase?: string): string {
  if (isProductionEnv()) {
    // If NEXTAUTH_URL is defined and is NOT localhost, use it
    if (
      process.env.NEXTAUTH_URL &&
      !process.env.NEXTAUTH_URL.includes("localhost") &&
      !process.env.NEXTAUTH_URL.includes("127.0.0.1") &&
      !process.env.NEXTAUTH_URL.includes("0.0.0.0")
    ) {
      return process.env.NEXTAUTH_URL.replace(/\/+$/, "");
    }

    // Check NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_SITE_URL
    const publicUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
    if (
      publicUrl &&
      !publicUrl.includes("localhost") &&
      !publicUrl.includes("127.0.0.1") &&
      !publicUrl.includes("0.0.0.0")
    ) {
      return publicUrl.replace(/\/+$/, "");
    }

    // Check Vercel deployment URL
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL.replace(/\/+$/, "")}`;
    }

    // Canonical production domain
    return CANONICAL_PRODUCTION_URL;
  }

  // Local development environment
  if (
    fallbackBase &&
    !fallbackBase.includes("localhost") &&
    !fallbackBase.includes("127.0.0.1") &&
    !fallbackBase.includes("0.0.0.0")
  ) {
    return fallbackBase.replace(/\/+$/, "");
  }

  return (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    fallbackBase ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

// In production or Vercel, dynamically normalize process.env.NEXTAUTH_URL if missing or pointing to localhost
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

if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET) {
  throw new Error(
    "FATAL CONFIGURATION: NEXTAUTH_SECRET environment variable is missing in production. " +
    "A cryptographically secure secret (minimum 32 characters) is required."
  );
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-dev-secret-key-at-least-32-chars",
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter an email and password");
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
          include: { workspace: true },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password");
        }

        const isMatch = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isMatch) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          workspaceId: user.workspaceId,
          workspaceName: user.workspace.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.workspaceId = user.workspaceId;
        token.workspaceName = user.workspaceName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.workspaceId = token.workspaceId;
        session.user.workspaceName = token.workspaceName;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      const canonicalBase = getCanonicalBaseUrl(baseUrl);

      // Relative path: e.g. "/login", "/dashboard"
      if (url.startsWith("/")) {
        return `${canonicalBase}${url}`;
      }

      // Absolute URL: inspect and enforce production rules
      try {
        const parsed = new URL(url);

        // In production, strictly reject and rewrite any redirect targeting localhost/127.0.0.1
        if (
          isProductionEnv() &&
          (parsed.hostname === "localhost" ||
            parsed.hostname === "127.0.0.1" ||
            parsed.hostname === "0.0.0.0")
        ) {
          return `${canonicalBase}${parsed.pathname}${parsed.search}${parsed.hash}`;
        }

        // Allow if origin matches canonical base or NextAuth baseUrl
        if (parsed.origin === canonicalBase || parsed.origin === baseUrl) {
          return url;
        }

        // Allow any official Vercel preview or production domain
        if (parsed.hostname.endsWith(".vercel.app")) {
          return url;
        }
      } catch {
        // Fallback on URL parse error
      }

      return canonicalBase;
    },
  },
};

export async function getAuthSession() {
  return await getServerSession(authOptions);
}

export type AuthSuccess = {
  authorized: true;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: string;
    workspaceId: string;
    workspaceName: string;
  };
  workspaceId: string;
};

export type AuthFailure = {
  authorized: false;
  response: NextResponse;
  user: null;
  workspaceId: null;
};

export type AuthResult = AuthSuccess | AuthFailure;

/**
 * Server-side guard to guarantee workspace isolation and role permissions.
 * Returns a typed discriminated union.
 */
export async function requireAuth(allowedRoles?: string[]): Promise<AuthResult> {
  const session = await getAuthSession();
  if (!session || !session.user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Unauthorized: Please log in" }, { status: 401 }),
      user: null,
      workspaceId: null,
    };
  }

  const user = session.user;
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: `Forbidden: Role '${user.role}' does not have permission for this action` },
        { status: 403 }
      ),
      user: null,
      workspaceId: null,
    };
  }

  return {
    authorized: true,
    user,
    workspaceId: user.workspaceId,
  };
}
