import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { CreateRoadmapItemSchema } from "@/lib/types";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roadmapItems = await prisma.roadmapItem.findMany({
      where: { workspaceId: session.user.workspaceId },
      include: {
        theme: {
          select: {
            id: true,
            name: true,
            color: true,
            _count: {
              select: { feedback: true },
            },
          },
        },
      },
      orderBy: { impactScore: "desc" },
    });

    return NextResponse.json({ items: roadmapItems });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch roadmap items" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateRoadmapItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const newItem = await prisma.roadmapItem.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        stage: parsed.data.stage,
        impactScore: parsed.data.impactScore,
        targetRelease: parsed.data.targetRelease,
        themeId: parsed.data.themeId || undefined,
        workspaceId: session.user.workspaceId,
      },
      include: {
        theme: true,
      },
    });

    return NextResponse.json({ item: newItem }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create roadmap item" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, stage, title, description, impactScore, targetRelease } = body;

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    const existing = await prisma.roadmapItem.findFirst({
      where: { id, workspaceId: session.user.workspaceId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Roadmap item not found or unauthorized" }, { status: 404 });
    }

    const updated = await prisma.roadmapItem.update({
      where: { id },
      data: {
        ...(stage && { stage }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(impactScore !== undefined && { impactScore: Number(impactScore) }),
        ...(targetRelease !== undefined && { targetRelease }),
      },
      include: {
        theme: true,
      },
    });

    return NextResponse.json({ item: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update roadmap item" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    const existing = await prisma.roadmapItem.findFirst({
      where: { id, workspaceId: session.user.workspaceId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Roadmap item not found or unauthorized" }, { status: 404 });
    }

    await prisma.roadmapItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Roadmap item deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete roadmap item" }, { status: 500 });
  }
}
