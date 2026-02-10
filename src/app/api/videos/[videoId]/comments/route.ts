import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  videoId: string;
}

export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { videoId } = await params;
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start") ? parseInt(searchParams.get("start")!) : undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

    const comments = await prisma.comment.findMany({
      take: limit,
      skip: start,
      where: { videoId: videoId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (comments.length > 0) {
      return NextResponse.json(comments, { status: 200 });
    } 

    return NextResponse.json({ message: "no comments found" }, { status: 404 });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}