import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from 'next';
import Error from "next/error";

interface Params {
  videoId?: string;
  start?: number,
  limit?: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  const params: Params = {
    videoId: (typeof req.query.videoId === 'string') ? req.query.videoId : undefined,
    start: (typeof req.query.start === 'string') ? parseInt(req.query.start) : undefined,
    limit: (typeof req.query.limit === 'string') ? parseInt(req.query.limit) : undefined
  }

  let where = {};
  if (params.videoId !== undefined) {
    where = { videoId: params.videoId };
  };

  try {
    const prisma = new PrismaClient();
    const comments = await prisma.comments.findMany({
      take: params.limit,
      skip: params.start,
      where: where, // if set
      orderBy: {
        createdAt: 'desc',
      }
    });

    if (comments.length > 0) {
      res.status(200).json(comments);
    } else {
      res.status(404).json("no comments found");
    }
  }

  catch (error) {
    if (error instanceof Error) {
      console.log(error);
    }
  }
}