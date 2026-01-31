import { prisma } from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from 'next';
import Error from "next/error";

interface Params {
  videoId?: string,
  userId?: string,
  search?: string,
  orderBy?: string,
  desc?: string,
  start?: number,
  limit?: number
}

const getTableName = function (str: string): string {
  switch (str) {
      case 'Date':
          return 'createdAt';
      case 'Likes':
          return 'posVotes';
      case 'Replies':
          return 'replyCount';
      default:
          return 'createdAt';
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  const params: Params = {
    videoId: (typeof req.query.videoId === 'string') ? req.query.videoId : undefined,
    userId: (typeof req.query.userId === 'string') ? req.query.userId : undefined,
    search: (typeof req.query.search === 'string') ? req.query.search : undefined,
    start: (typeof req.query.start === 'string') ? parseInt(req.query.start) : undefined,
    orderBy: (typeof req.query.orderBy === 'string') ? req.query.orderBy : undefined,
    desc: (typeof req.query.desc === 'string') ? req.query.desc : undefined,
    limit: (typeof req.query.limit === 'string') ? parseInt(req.query.limit) : undefined
  }

  let where = {};
  let include = {};
  let orderByName = 'createdAt';
  const sortingOrder = params.desc === 'false' ? 'asc' : 'desc';

  if (params.orderBy !== undefined) {
    orderByName = getTableName(params.orderBy);
  }

  if (params.videoId !== undefined) {
    where = { videoId: params.videoId, content: { contains: params.search }};
  } else {
    where = { content: { contains: params.search }};
    include = { video: true };
  }

  if (params.userId !== undefined) { // JOIN video if we request comments from the user page.
    where = { userId: params.userId, content: { contains: params.search }};
    include = { video: true };
  }

  try {
    const comments = await prisma.comments.findMany({
      take: params.limit,
      skip: params.start,
      where: where,
      orderBy: {
        [orderByName]: sortingOrder,
      },
      include: include
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