import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (typeof req.query.videoId === 'string') {
        const videoId = req.query.videoId;
        const prisma = new PrismaClient();
        const resp = await prisma.videos.findFirst({
            where: {
                id: videoId, 
            },
        });
        if (resp !== null) {
            return res.status(200).json(resp.title);
        } else {
            return res.status(404).json("title not found.");
        }
    }
}