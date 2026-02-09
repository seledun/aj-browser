import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

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

export async function GET(req: NextRequest) {
  const params: Params = {
    videoId: req.nextUrl.searchParams.get("videoId") ?? undefined,
    userId: req.nextUrl.searchParams.get("userId") ?? undefined,
    search: req.nextUrl.searchParams.get("search") ?? undefined,
    start: req.nextUrl.searchParams.get("start") ? parseInt(req.nextUrl.searchParams.get("start")!) : undefined,
    orderBy: req.nextUrl.searchParams.get("orderBy") ?? undefined,
    desc: req.nextUrl.searchParams.get("desc") ?? undefined,
    limit: req.nextUrl.searchParams.get("limit") ? parseInt(req.nextUrl.searchParams.get("limit")!) : undefined
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
    const comments = await prisma.comment.findMany({
      take: params.limit,
      skip: params.start,
      where: where,
      orderBy: {
        [orderByName]: sortingOrder,
      },
      include: include
    });

    if (comments.length > 0) {
      return NextResponse.json(comments, { status: 200 });
    } else {
      return NextResponse.json("no comments found", { status: 404 });
    }
  }

  catch (error) {
    if (error instanceof Error) {
      console.log(error);
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}