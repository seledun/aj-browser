import { prisma } from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, res: NextResponse) {
    const resp = await prisma.reply.count();
    return NextResponse.json(resp, { status: 200 });
}