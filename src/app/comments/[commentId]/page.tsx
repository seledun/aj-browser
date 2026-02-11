'use client'

import { useEffect, useState } from "react";
import { getCommentById, Comment } from "@/utils/comment-utils";
import { getVideoById, Video } from "@/utils/video-utils";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Link } from "@heroui/link";
import { Tooltip } from "@heroui/tooltip";
import { Spinner } from "@heroui/spinner";
import { format, parseISO } from "date-fns";
import { useParams } from "next/navigation";
import CommentReplyDrawer from "@/components/CommentReplyDrawer";

export default function SingleCommentPage() {
    const [commentData, setCommentData] = useState<Comment | null>(null);
    const [videoData, setVideoData] = useState<Video | null>(null);
    const [loading, setLoading] = useState(true);
    const [replyDrawerOpen, setReplyDrawerOpen] = useState(false);
    const params = useParams();

    useEffect(() => {
        const fetchAllData = async () => {
            const id = params.commentId as string | undefined;
            if (!id) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const comment = await getCommentById(id);
                if (comment) {
                    setCommentData(comment);

                    const video = await getVideoById(comment.videoId);
                    if (video) setVideoData(video);
                }
            } catch (err) {
                console.error("Failed to load data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [params.commentId]);

    return (
        <div className="min-h-screen flex flex-col">
            {/* Centering Wrapper */}
            <main className="grow flex items-center justify-center p-4">
                {commentData && (
                    <CommentReplyDrawer
                        isOpen={replyDrawerOpen}
                        onClose={() => setReplyDrawerOpen(false)}
                        parent={commentData}
                    />
                )}
                {loading ? (
                    <Spinner size="lg" label="Loading comment..." />
                ) : commentData && videoData ? (
                    /* The Card Container - max-width controls the "good area" */
                    <div className="w-full max-w-5xl">
                        <Card shadow="md" radius="lg" className="border-none bg-content1">
                            <CardHeader className="flex flex-col items-start px-6 pt-6">
                                <span className="text-sm text-slate-500 pb-2">comment for video</span>
                                <Tooltip
                                    content={videoData.title}
                                    delay={500}
                                    portalContainer={typeof window !== "undefined" ? document.body : undefined}
                                >
                                    <div className="w-full">
                                        <Link
                                            className="text-lg font-bold text-primary hover:underline no-underline!"
                                            href={`/videos/${commentData.videoId}/`}
                                        >
                                            {videoData.title}
                                        </Link>
                                    </div>
                                </Tooltip>
                            </CardHeader>

                            <CardBody className="px-6 py-4">
                                <div className="text-default-600 text-base leading-relaxed">
                                    <Link
                                        className="font-semibold text-default-700 hover:text-primary pr-2"
                                        href={`/users/${commentData.userId}`}
                                        underline="none"
                                    >
                                        {commentData.username}:
                                    </Link>
                                    {commentData.content}
                                </div>
                            </CardBody>

                            <Divider />

                            <CardFooter className="bg-default-50/50 p-6">
                                <div className="grid grid-cols-3 gap-4 text-center w-full items-center">
                                    <div className="flex flex-col items-center">
                                        <p className="text-[11px] uppercase text-default-400 font-bold mb-1">Posted</p>
                                        <p className="text-sm font-semibold text-default-600">
                                            {format(parseISO(commentData.createdAt), "yyyy/MM/dd HH:mm")}
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-center border-x border-default-200">
                                        <p className="text-[11px] uppercase text-default-400 font-bold mb-1">Likes</p>
                                        <p className="text-sm font-mono font-bold text-success-700">{commentData.posVotes}</p>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <p className="text-[11px] uppercase text-default-400 font-bold mb-1">Replies</p>
                                        <button
                                            className={`text-sm font-mono ${commentData.replyCount > 0 ? "text-primary hover:underline cursor-pointer" : "text-default-400 cursor-default"}`}
                                            onClick={() => {
                                                if (commentData.replyCount > 0) {
                                                    setReplyDrawerOpen(true);
                                                }
                                            }}
                                        >
                                            {commentData.replyCount}
                                        </button>
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                ) : (
                    <div className="text-center">
                        <h2 className="text-xl font-bold">Comment not found</h2>
                        <Link href="/" className="mt-4">Return to Search</Link>
                    </div>
                )}
            </main>
        </div>
    );
}
