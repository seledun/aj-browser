import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from 'next';
import Error from "next/error";

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
        default:
            return 'createdAt';
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

    const params: Params = {
        videoId: (typeof req.query.videoId === 'string') ? req.query.videoId : undefined,
        start: (typeof req.query.start === 'string') ? parseInt(req.query.start) : undefined,
        limit: (typeof req.query.limit === 'string') ? parseInt(req.query.limit) : undefined,
        search: (typeof req.query.search === 'string') ? req.query.search : undefined,
        orderBy: (typeof req.query.orderBy === 'string') ? req.query.orderBy : undefined,
        desc: (typeof req.query.desc === 'string') ? req.query.desc : undefined
    }

    const prisma = new PrismaClient();
    const sortingOrder = params.desc === 'false' ? 'asc' : 'desc';

    const orderByName = typeof params.orderBy === 'string' ? getTableName(params.orderBy) : 'createdAt';

    if (params.search !== undefined) {
        if (params.orderBy !== undefined) {
            const resp = await prisma.videos.findMany({
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
            res.status(200).json(resp);
            return;
        }
    }

    try {
        if (params.orderBy !== undefined) {
        const videos = await prisma.videos.findMany({
            take: params.limit,
            skip: params.start,
            orderBy: {
                [orderByName]: sortingOrder,
            }
        });

        if (videos.length > 0) {
            res.status(200).json(videos);
            return;
        } else {
            res.status(404).json("no videos found");
            return;
        }
    }
    }

    catch (error) {
        if (error instanceof Error) {
            console.error(error);
        }
    }
}
