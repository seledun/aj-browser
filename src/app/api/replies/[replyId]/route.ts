import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Removed 'res: NextResponse' from the arguments below
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ replyId: string }> }
) {
    try {
        const { replyId } = await params;

        const resp = await prisma.reply.findFirst({
            where: {
                id: replyId, // No 'as string' needed if your interface is correct
            },
        });

        if (resp) {
            return NextResponse.json(resp, { status: 200 });
        } else {
            // It's usually better to return an object { error: "..." } for consistency
            return NextResponse.json({ error: "reply not found." }, { status: 404 });
        }
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}