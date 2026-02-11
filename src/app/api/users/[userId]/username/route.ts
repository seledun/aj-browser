import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;

    const resp = await prisma.comment.findFirst({
        where: {
            userId: userId,
        },
    });
    if (resp !== null) {
        return NextResponse.json(resp.username, { status: 200 });
    } else {
        return NextResponse.json("title not found.", { status: 404 });
    }
}