import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { CreateActionItemSchema } from "@/lib/types";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actionItems = await prisma.actionItem.findMany({
      where: { workspaceId: session.user.workspaceId },
      include: {
        feedback: {
          select: {
            id: true,
            content: true,
            customerLabel: true,
            sentiment: true,
            channel: true,
          },
        },
        createdBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ actions: actionItems });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch action items" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateActionItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    // Generate external ticket key if not passed (e.g. LOO-143)
    const existingCount = await prisma.actionItem.count({
      where: { workspaceId: session.user.workspaceId },
    });
    const prefix = parsed.data.integration === "JIRA" ? "ENG" : "LOO";
    const externalKey = parsed.data.externalKey || `${prefix}-${140 + existingCount}`;

    const newAction = await prisma.actionItem.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        integration: parsed.data.integration,
        externalKey,
        priority: parsed.data.priority,
        feedbackId: parsed.data.feedbackId || undefined,
        createdById: session.user.id,
        workspaceId: session.user.workspaceId,
      },
      include: {
        feedback: true,
      },
    });

    // Automatically transition feedback status to ACTIONED if feedbackId provided
    if (parsed.data.feedbackId) {
      await prisma.feedback.updateMany({
        where: { id: parsed.data.feedbackId, workspaceId: session.user.workspaceId },
        data: { status: "ACTIONED" },
      });
    }

    return NextResponse.json({ action: newAction }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create action ticket" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, priority, title, description } = body;

    if (!id) {
      return NextResponse.json({ error: "Action item ID required" }, { status: 400 });
    }

    const existing = await prisma.actionItem.findFirst({
      where: { id, workspaceId: session.user.workspaceId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Action item not found or unauthorized" }, { status: 404 });
    }

    const updated = await prisma.actionItem.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json({ action: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update action item" }, { status: 500 });
  }
}
