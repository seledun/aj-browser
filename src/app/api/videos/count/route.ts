import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const resp = await prisma.video.count();
    return NextResponse.json(resp, { status: 200 });
}