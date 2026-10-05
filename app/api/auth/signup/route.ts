import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { SignupSchema } from "@/lib/types";
import { recordAuditLog } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = SignupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { name, email, password, workspaceName } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Generate unique slug for workspace
    const baseSlug = workspaceName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    let slug = baseSlug || "workspace";
    const existingSlug = await db.workspace.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Create Workspace and Admin User in a transaction
    const passwordHash = await bcrypt.hash(password, 10);

    const workspace = await db.workspace.create({
      data: {
        name: workspaceName,
        slug,
        users: {
          create: {
            name,
            email: normalizedEmail,
            passwordHash,
            role: "ADMIN",
          },
        },
      },
      include: {
        users: true,
      },
    });

    // Seed default themes for the new workspace
    const defaultThemes = [
      { name: "Onboarding & Setup", description: "Signup flows, invitations, team setup", color: "#3b82f6" },
      { name: "Billing & Invoices", description: "Pricing, checkout, invoices, credit card payments", color: "#ef4444" },
      { name: "Performance & Speed", description: "Page load speeds, search latency, timeouts", color: "#f59e0b" },
      { name: "Mobile Experience", description: "Mobile responsiveness and touch navigation", color: "#8b5cf6" },
      { name: "Integrations & APIs", description: "SSO, REST API, webhooks, third-party connectors", color: "#10b981" },
      { name: "Feature Requests", description: "Product ideas and roadmap suggestions", color: "#06b6d4" },
    ];

    for (const t of defaultThemes) {
      await db.theme.create({
        data: {
          name: t.name,
          description: t.description,
          color: t.color,
          workspaceId: workspace.id,
        },
      });
    }

    await recordAuditLog({
      workspaceId: workspace.id,
      actorEmail: normalizedEmail,
      actorRole: "ADMIN",
      action: "AUTH_SIGNUP",
      entity: "Workspace",
      entityId: workspace.id,
      metadata: { workspaceName, initialRole: "ADMIN" },
    });

    return NextResponse.json({
      success: true,
      message: "Workspace and user account created successfully",
      workspaceId: workspace.id,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred during registration" },
      { status: 500 }
    );
  }
}
