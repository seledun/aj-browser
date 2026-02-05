import { prisma } from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const latestRecord = await prisma.modified.findFirst({
            orderBy: {
                id: 'desc',
            },
        });
        return res.status(200).json(latestRecord?.updated);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred while fetching the latest record' });
    } finally {
        await prisma.$disconnect();
    }
}