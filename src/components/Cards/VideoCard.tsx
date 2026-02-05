import { Video } from "@/utils/video-utils"
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card"
import { Tooltip } from "@heroui/tooltip" // Import Tooltip
import { Divider } from "@heroui/divider" // Cleaner than <hr>
import { format, parseISO } from "date-fns"
import Link from "next/link"

function VideoCard({ video }: { video: Video }) {
  return (
    <Card
      className="w-full my-3" // Changed min-w to w-full for your grid layout
      radius="lg"
      shadow="sm"
      isHoverable
      key={video.id}
    >
      <CardHeader className="flex-col items-start px-4 pt-4">
        {/* Tooltip handles the hover, line-clamp-3 handles the truncation */}
        <Tooltip 
          content={video.title} 
          delay={500} 
          closeDelay={0}
          className="max-w-xs"
        >
          <h1 className="text-md font-bold leading-tight line-clamp-3 cursor-help">
            {video.title}
          </h1>
        </Tooltip>
      </CardHeader>

      <CardBody className="py-2">
        <p className="text-sm text-default-500">
          {video.summary}
        </p>
      </CardBody>

      <Divider />

      <CardFooter>
        <div className="grid grid-cols-3 gap-y-4 gap-x-2 text-center text-tiny w-full">
          <div>
            <p className="text-default-400">Posted</p>
            <p className="font-semibold">{format(parseISO(video.createdAt), "yy/MM/dd")}</p>
          </div>
          <div>
            <p className="text-default-400">Likes</p>
            <p className="font-semibold">{video.likeCount}</p>
          </div>
          <div>
            <p className="text-default-400">Anger</p>
            <p className="font-semibold">{video.angerCount}</p>
          </div>
          <div>
            <p className="text-default-400">Runtime</p>
            <p className="font-semibold">{video.duration ? Math.round(video.duration / 60) + 'm' : 'n/a'}</p>
          </div>
          <div>
            <p className="text-default-400">Comments</p>
            <p className="font-semibold text-primary">
              {video.commentCount ? (
                <Link href={"/video?videoId=" + video.id}>{video.commentCount}</Link>
              ) : "0"}
            </p>
          </div>
          <div>
            <p className="text-default-400">Views</p>
            <p className="font-semibold">{video.playCount}</p>
          </div>

          <div className="col-span-3 pt-2 border-t border-default-100">
            <a 
              href={"https://banned.video/watch?id=" + video.id} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline text-xs"
            >
              Watch on banned.video
            </a>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

export default VideoCard;