import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const { commentId } = await params;
  const replies = await prisma.reply.findMany({
    where: {
      id: commentId,
    },
  });

  return NextResponse.json(replies);
}