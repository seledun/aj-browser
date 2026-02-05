'use client'

import { format, parseISO } from "date-fns";
import { fetchComments, fetchUserCommentCount, fetchUserComments, fetchUserName } from "@/utils/comment-utils";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { Button } from "@heroui/button";
import { Link } from "@heroui/react";
import { Video } from "@/utils/video-utils";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { Divider, Tooltip } from "@heroui/react";

interface Comment {
    id: string,
    videoId: string,
    content: string,
    userId: string,
    username: string,
    posVotes: number,
    createdAt: string,
    replyCount: number,
    video?: Video
}

export default function Comments() {

    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [page, setPage] = useState<number>(0);
    const [userId, setUserId] = useState<string>("");
    const [username, setUsername] = useState<string>("");
    const [commentCount, setCommentCount] = useState<number>(0);

    useEffect(() => {
        const ret = new URLSearchParams(window.location.search).get('userId');
        if (ret !== null && ret !== "") {
            setUserId(ret);
        }
    }, []);

    useEffect(() => {
        if (userId !== "") {
            loadComments(userId);
            fetchUsername(userId);
            fetchCommentCount(userId);
        }
    }, [userId]);

    const limit = 25;

    const fetchUsername = async (id: string) => {
        const name = await fetchUserName(id);
        if (typeof name === 'string') {
            setUsername(name);
        }
    }

    const fetchCommentCount = async (id: string) => {
        const count = await fetchUserCommentCount(id);
        if (typeof count !== undefined) {
            setCommentCount(count);
        }
    }

    const loadComments = async (id: string) => {
        setLoading(true);
        if (typeof userId === 'string') {
            const resp = await fetchUserComments(id, (page * limit), limit);
            if (resp !== undefined) {
                setComments(resp);
            }
        }
        setLoading(false);
    }

    const nextPage = async () => {
        setLoading(true);
        if (typeof userId === 'string') {
            const resp = await fetchUserComments(userId, (page + 1) * limit, limit);
            if (resp !== undefined) {
                setPage(page + 1);
                setComments(resp);
            }
        }
        setLoading(false);
    }

    const prevPage = async () => {
        if (page > 0) {
            setLoading(true);
            if (typeof userId === 'string') {
                const resp = await fetchUserComments(userId, (page - 1) * limit, limit);
                if (resp !== undefined) {
                    setPage(page - 1);
                    setComments(resp);
                }
            }
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header Section */}
            <div className="flex flex-col gap-6 items-center w-full px-4 py-4">
                <Accordion
                    className="sticky top-2 z-40 w-full max-w-2xl mx-auto"
                    variant="shadow"
                    isCompact
                    defaultExpandedKeys={["1"]}
                >
                    <AccordionItem
                        key="1"
                        title={
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-default-600">
                                    Showing {commentCount} comments for
                                </span>
                                <span className="text-small font-bold text-primary">
                                    @{username}
                                </span>
                            </div>
                        }
                    >
                        <div className="flex flex-col items-center gap-4 p-4 pt-0">
                            <div className="flex items-center gap-4">
                                <Button
                                    isIconOnly
                                    variant="flat"
                                    size="sm"
                                    isDisabled={page === 0}
                                    onPress={() => prevPage()}
                                >
                                    ‹
                                </Button>
                                <span className="text-sm font-semibold min-w-20 text-center">
                                    Page {page + 1}
                                </span>
                                <Button
                                    isIconOnly
                                    variant="flat"
                                    size="sm"
                                    onPress={() => nextPage()}
                                >
                                    ›
                                </Button>
                            </div>

                            <Divider className="my-2" />

                            <Link href="/" size="sm" showAnchorIcon className="text-default-500">
                                Back to search
                            </Link>
                        </div>
                    </AccordionItem>
                </Accordion>

                {/* Comments List Section */}
                <main className="w-full max-w-3xl mx-auto pb-10">
                    {!loading ? (
                        <ul className="flex flex-col gap-4 p-0 list-none">
                            {comments.map((comment) => (
                                <li key={comment.id}>
                                    <Card shadow="sm" radius="lg" isHoverable className="border-none">
                                        <CardHeader className="flex-col items-start px-6 pt-5 gap-1">
                                            <h2 className="text-md font-bold text-default-700">@{comment.username}</h2>

                                            {/* Tooltip for the specific video title */}
                                            <Tooltip
                                                content={comment.video?.title}
                                                delay={500}
                                                portalContainer={typeof window !== "undefined" ? document.body : undefined}
                                            >
                                                <div className="w-full pointer-events-auto">
                                                    <Link
                                                        href={"/video?videoId=" + comment.videoId}
                                                        className="text-xs font-semibold text-primary line-clamp-1"
                                                    >
                                                        {comment.video?.title}
                                                    </Link>
                                                </div>
                                            </Tooltip>
                                        </CardHeader>

                                        <CardBody className="px-6 py-2 text-default-600 leading-relaxed">
                                            <p className="whitespace-pre-wrap">{comment.content}</p>
                                        </CardBody>

                                        <Divider className="my-2" />

                                        <CardFooter className="px-6 pb-5">
                                            <div className="flex justify-between w-full text-tiny text-default-400">
                                                <div className="flex flex-col">
                                                    <span className="font-bold uppercase tracking-tighter text-[10px]">Posted</span>
                                                    <span className="font-medium text-default-500">{format(parseISO(comment.createdAt), "yy/MM/dd HH:mm")}</span>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="font-bold uppercase tracking-tighter text-[10px]">Likes</span>
                                                    <span className="font-mono text-success-600 font-semibold">{comment.posVotes}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="font-bold uppercase tracking-tighter text-[10px]">Replies</span>
                                                    <span className="font-mono text-default-600 font-semibold">{comment.replyCount}</span>
                                                </div>
                                            </div>
                                        </CardFooter>
                                    </Card>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex justify-center items-center h-[50vh]">
                            <Spinner size="lg" label="Loading user comments..." />
                        </div>
                    )}
                </main>
            </div>
            <Footer />
        </div>
    )
}