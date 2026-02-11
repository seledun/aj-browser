import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
    const userId = params.userId;

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