import { prisma } from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (typeof req.query.replyId === 'string') {
    const replyId = req.query.replyId;
        const resp = await prisma.reply.findFirst({
            where: {
                id: replyId, 
            },
        });
        if (resp !== null) {
            return res.status(200).json(resp);
        } else {
            return res.status(404).json("reply not found.");
        }
    }
}