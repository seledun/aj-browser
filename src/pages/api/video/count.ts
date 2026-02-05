import { prisma } from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const resp = await prisma.video.count();
    return res.status(200).json(resp);
}