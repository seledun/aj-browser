import { Video } from "@/utils/video-utils"
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card"
import { Tooltip } from "@heroui/tooltip"
import { Divider } from "@heroui/divider"
import { format, parseISO } from "date-fns"
import { Link } from "@heroui/react"

function VideoCard({ video }: { video: Video }) {
  return (
    <Card
      className="w-full h-full my-3"
      radius="lg"
      shadow="sm"
      isHoverable
      key={video.id}
    >
<CardHeader className="flex-col items-start px-4 pt-4">
  <Tooltip
    content={video.title}
    delay={500}
    closeDelay={0}
    className="max-w-xs"
  >
    <h1 className="text-md font-bold leading-tight cursor-help">
      {video.commentCount > 0 ? (
        <Link 
          href={`/video?videoId=${video.id}`} 
          className="line-clamp-3 hover:underline no-underline!"
        >
          {video.title}
        </Link>
      ) : (
        <span className="line-clamp-3">
          {video.title}
        </span>
      )}
    </h1>
  </Tooltip>
</CardHeader>

      <CardBody className="py-2">
        <p className="text-sm text-default-500">
          {video.summary}
        </p>
      </CardBody>

      <Divider />

      <CardFooter className="bg-default-50/50 border-t border-default-100 flex-col gap-3">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 w-full text-center">

          {/* ROW 1 */}
          <div className="flex flex-col py-2">
            <p className="text-[10px] uppercase text-default-400 font-bold leading-tight mb-1">Posted</p>
            <p className="text-tiny font-semibold">{format(parseISO(video.createdAt), "yyyy/MM/dd HH:mm")}</p>
          </div>

          {/* Vertical borders on middle column */}
          <div className="flex flex-col py-2 border-x border-default-200/50">
            <p className="text-[10px] uppercase text-default-400 font-bold leading-tight mb-1">Likes</p>
            <p className="text-tiny font-semibold text-success">{video.likeCount}</p>
          </div>

          <div className="flex flex-col py-2">
            <p className="text-[10px] uppercase text-default-400 font-bold leading-tight mb-1">Anger</p>
            <p className="text-tiny font-semibold text-danger">{video.angerCount}</p>
          </div>

          {/* ROW 2 - Added border-t to separate from Row 1 */}
          <div className="flex flex-col py-2 border-t border-default-200/50">
            <p className="text-[10px] uppercase text-default-400 font-bold leading-tight mb-1">Runtime</p>
            <p className="text-tiny font-semibold">{video.duration ? Math.round(video.duration / 60) + 'm' : 'n/a'}</p>
          </div>

          {/* Middle column with both vertical and horizontal borders */}
          <div className="flex flex-col py-2 border-t border-x border-default-200/50">
            <p className="text-[10px] uppercase text-default-400 font-bold leading-tight mb-1">Comments</p>
            <div className="text-tiny font-semibold text-primary">
              {video.commentCount ? (
                <Link href={"/video?videoId=" + video.id} size="sm" className="text-tiny font-semibold p-0 h-auto underline-none!">
                  {video.commentCount}
                </Link>
              ) : "0"}
            </div>
          </div>

          <div className="flex flex-col py-2 border-t border-default-200/50">
            <p className="text-[10px] uppercase text-default-400 font-bold leading-tight mb-1">Views</p>
            <p className="text-tiny font-semibold">{video.playCount}</p>
          </div>
        </div>

        {/* External Link Section */}
        <div className="w-full pt-2 border-t border-default-200/50 text-center">
          <a
            href={"https://banned.video/watch?id=" + video.id}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-xs font-medium"
          >
            Watch on banned.video
          </a>
        </div>
      </CardFooter>
    </Card>
  )
}

export default VideoCard;