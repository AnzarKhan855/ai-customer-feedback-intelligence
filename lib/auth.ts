import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

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
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        // Fallback to baseUrl if parsing fails
      }
      return baseUrl;
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
