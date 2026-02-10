import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface Params {
    videoId?: string,
    start?: number,
    limit?: number
    search?: string,
    orderBy?: string,
    desc?: string
}

const getTableName = function (str: string): string {
    switch (str) {
        case 'Date':
            return 'createdAt';
        case 'Likes':
            return 'likeCount';
        case 'Anger':
            return 'angerCount';
        case 'Comments':
            return 'commentCount';
        case 'Runtime':
            return 'duration';
        case 'Views':
            return 'playCount';
        default:
            return 'createdAt';
    }
}

export async function GET(req: NextRequest) {
    const params: Params = {
        videoId: req.nextUrl.searchParams.get("videoId") ?? undefined,
        start: req.nextUrl.searchParams.get("start") ? parseInt(req.nextUrl.searchParams.get("start")!) : undefined,
        limit: req.nextUrl.searchParams.get("limit") ? parseInt(req.nextUrl.searchParams.get("limit")!) : undefined,
        search: req.nextUrl.searchParams.get("search") ?? undefined,
        orderBy: req.nextUrl.searchParams.get("orderBy") ?? undefined,
        desc: req.nextUrl.searchParams.get("desc") ?? undefined
    }

    const sortingOrder = params.desc === 'false' ? 'asc' : 'desc';
    const orderByName = typeof params.orderBy === 'string' ? getTableName(params.orderBy) : 'createdAt';

    if (params.search !== undefined) {
        if (params.orderBy !== undefined) {
            const resp = await prisma.video.findMany({
                where: {
                    title: {
                        contains: params.search,
                    }
                },
                take: params.limit,
                skip: params.start,
                orderBy: {
                    [orderByName]: sortingOrder,
                }
            })
            return NextResponse.json(resp, { status: 200 });
        }
    }

    try {
        if (params.orderBy !== undefined) {
            const videos = await prisma.video.findMany({
                take: params.limit,
                skip: params.start,
                orderBy: {
                    [orderByName]: sortingOrder,
                }
            });

            if (videos.length > 0) {
                return NextResponse.json(videos, { status: 200 });
            } else {
                return NextResponse.json("no videos found", { status: 404 });
            }
        }
    }

    catch (error) {
        if (error instanceof Error) {
            console.error(error);
        }
    }
}
