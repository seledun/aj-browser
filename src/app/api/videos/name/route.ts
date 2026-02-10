import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const videoId = req.nextUrl.searchParams.get("videoId") ?? undefined;
    const resp = await prisma.video.findFirst({
        where: {
            id: videoId,
        },
    });
    if (resp !== null) {
        return NextResponse.json(resp.title, { status: 200 });
    } else {
        return NextResponse.json("title not found.", { status: 404 });
    }
}
