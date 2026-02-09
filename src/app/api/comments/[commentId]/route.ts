import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ commentId: string }> }
) {
  const { commentId } = await params;
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    return NextResponse.json(comment);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}