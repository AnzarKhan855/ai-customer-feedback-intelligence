import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId!;

  try {
    const users = await db.user.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ members: users });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch workspace members" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  // Only ADMIN can invite or add new teammates
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId!;

  try {
    const body = await req.json();
    const { name, email, role, password } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ error: "Name, email, and role are required" }, { status: 400 });
    }

    if (!["ADMIN", "ANALYST", "VIEWER"].includes(role)) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password || "password123", 10);

    const newUser = await db.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        role,
        passwordHash,
        workspaceId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, member: newUser });
  } catch (error) {
    console.error("Invite member error:", error);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAuth(["ADMIN"]);
  if (!auth.authorized) return auth.response;

  const workspaceId = auth.workspaceId!;

  try {
    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !role || !["ADMIN", "ANALYST", "VIEWER"].includes(role)) {
      return NextResponse.json({ error: "Valid userId and role are required" }, { status: 400 });
    }

    // Verify user is in same workspace
    const user = await db.user.findFirst({ where: { id: userId, workspaceId } });
    if (!user) {
      return NextResponse.json({ error: "Member not found in this workspace" }, { status: 404 });
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({ success: true, member: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update member role" }, { status: 500 });
  }
}
