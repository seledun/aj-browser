import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const resp = await prisma.video.count();
    return NextResponse.json(resp, { status: 200 });
}