import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (typeof req.query.userId === 'string') {
        const userId = req.query.userId;
        const prisma = new PrismaClient();
        const resp = await prisma.comments.findFirst({
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