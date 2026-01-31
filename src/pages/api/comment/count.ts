import { prisma } from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from 'next';

export interface CommentCountParams {
    videoId?: string,
    userId?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const params: CommentCountParams = {
        videoId: (typeof req.query.videoId === 'string') ? req.query.videoId : undefined,
        userId: (typeof req.query.userId === 'string') ? req.query.userId : undefined
    }

    let where = {};
    if (params.videoId !== undefined) {
        where = { videoId: params.videoId };
    }
    else if (params.userId !== undefined) {
        where = { userId: params.userId };
    }

    const resp = await prisma.comments.count({where: where});
    return res.status(200).json(resp);
}