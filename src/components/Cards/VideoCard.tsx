import { Video } from "@/utils/video-utils"
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card"
import { format, parseISO } from "date-fns"
import Link from "next/link"

function VideoCard({ video }: { video: Video }) {
    return (
        <Card
            className="min-w-80.5 my-3"
            radius="sm"
            key={video.id}
        >
            <CardHeader className="text-md"><h1 className="px-2 pt-2"><b>{video.title}</b></h1></CardHeader>
            <CardBody>
                <p className="px-4">
                    {video.summary}
                </p>
            </CardBody>
            <hr></hr>
            <CardFooter>
                <div className="grid grid-cols-3 xl:grid-cols-3 gap-2 text-center text-sm w-full">
                    <p>Posted<br></br><b>{format(parseISO(video.createdAt), "yy/MM/dd HH:mm")}</b></p>
                    <p>Likes<br></br><b>{video.likeCount}</b></p>
                    <p>Anger<br></br><b>{video.angerCount}</b></p>
                    <p>Runtime<br></br><b>{video.duration ? Math.round(video.duration / 60) + 'min' : 'n/a'}</b></p>
                    <p>Comments<br></br><b>{video.commentCount ? <Link href={"/video?videoId=" + video.id}>{video.commentCount}</Link> : "0"}</b></p>
                    <p>Views<br></br><b>{video.playCount}</b></p>
                    <ul className="col-span-3">
                        <span><b>Links</b></span>
                        <li><a href={"https://banned.video/watch?id=" + video.id} target="_blank" rel="noopener noreferrer">banned.video</a></li>
                    </ul>
                </div>
            </CardFooter>
        </Card>
    )
}
export default VideoCard;