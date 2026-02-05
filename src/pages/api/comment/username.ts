import { prisma } from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (typeof req.query.userId === 'string') {
        const userId = req.query.userId;
        const resp = await prisma.comment.findFirst({
            where: {
                userId: userId, 
            },
        });
        if (resp !== null) {
            return res.status(200).json(resp.username);
        } else {
            return res.status(404).json("title not found.");
        }
    }
}