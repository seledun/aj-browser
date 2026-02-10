import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
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
    }
}