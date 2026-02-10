import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export interface CommentCountParams {
    videoId?: string,
    userId?: string
}

export async function GET(req: NextRequest) {
    const params: CommentCountParams = {
        videoId: req.nextUrl.searchParams.get("videoId") ?? undefined,
        userId: req.nextUrl.searchParams.get("userId") ?? undefined
    }

    let where = {};
    if (params.videoId !== undefined) {
        where = { videoId: params.videoId };
    }
    else if (params.userId !== undefined) {
        where = { userId: params.userId };
    }

    const resp = await prisma.comment.count({where: where});
    return NextResponse.json(resp, { status: 200 });
}