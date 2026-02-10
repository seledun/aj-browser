import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const commentId = req.nextUrl.searchParams.get("commentId") ?? undefined;
    const resp = await prisma.reply.findMany({
        where: {
            replyTo: commentId,
        },
    });
    if (resp !== null) {
        return NextResponse.json(resp, { status: 200 });
    } else {
        return NextResponse.json("replies not found.", { status: 404 });
    }
}