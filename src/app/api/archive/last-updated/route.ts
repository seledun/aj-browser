import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(resp: NextResponse, req: NextRequest) {
    try {
        const latestRecord = await prisma.modified.findFirst({
            orderBy: {
                id: 'desc',
            },
        });
        return NextResponse.json(latestRecord?.updated);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'An error occurred while fetching the latest record' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}