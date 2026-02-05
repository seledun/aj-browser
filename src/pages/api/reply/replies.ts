import { prisma } from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (typeof req.query.commentId === 'string') {
        const commentId = req.query.commentId;
        const resp = await prisma.reply.findMany({
            where: {
                replyTo: commentId, 
            },
        });
        if (resp !== null) {
            return res.status(200).json(resp);
        } else {
            return res.status(404).json("replies not found.");
        }
    } else {
        return res.status(400).json("commentId query parameter is required and must be a string.");
    }
}