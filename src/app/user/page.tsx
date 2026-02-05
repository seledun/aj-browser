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
import CommentReplyDrawer from "@/components/CommentReplyDrawer";

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

    const [replyDrawerOpen, setReplyDrawerOpen] = useState<boolean>(false);
    const [selectedComment, setSelectedComment] = useState<Comment | null>(null);

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
                        <div>
                            {selectedComment && (
                                <CommentReplyDrawer
                                    isOpen={replyDrawerOpen}
                                    onClose={() => setReplyDrawerOpen(false)}
                                    parent={selectedComment}
                                />
                            )}

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
                                                <div className="flex justify-between w-full text-tiny text-default-400 items-center">
                                                    {/* Column 1: Posted */}
                                                    <div className="flex flex-col">
                                                        <span className="font-bold uppercase tracking-tighter text-[10px]">Posted</span>
                                                        <span className="font-medium text-default-500">{format(parseISO(comment.createdAt), "yy/MM/dd HH:mm")}</span>
                                                    </div>

                                                    {/* Column 2: Likes */}
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-bold uppercase tracking-tighter text-[10px]">Likes</span>
                                                        <span className="font-mono text-success-600 font-semibold">{comment.posVotes}</span>
                                                    </div>

                                                    {/* Column 3: Replies */}
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-bold uppercase tracking-tighter text-[10px]">Replies</span>
                                                        <button
                                                            className={`text-sm font-mono ${comment.replyCount > 0 ? "text-primary hover:underline cursor-pointer" : "text-default-400 cursor-default"}`}
                                                            onClick={() => {
                                                                if (comment.replyCount > 0) {
                                                                    setSelectedComment(comment);
                                                                    setReplyDrawerOpen(true);
                                                                }
                                                            }}
                                                        >
                                                            {comment.replyCount}
                                                        </button>
                                                    </div>

                                                    {/* Column 4: Share (New) */}
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-bold uppercase tracking-tighter text-[10px]">Share</span>
                                                        <Tooltip content="Open Single View" delay={500}>
                                                            <Link
                                                                href={`/comments/single-comment?commentId=${comment.id}`}
                                                                className="text-default-400 hover:text-primary transition-colors pt-1"
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    strokeWidth={2.5}
                                                                    stroke="currentColor"
                                                                    className="w-3.5 h-3.5"
                                                                >
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                                                </svg>
                                                            </Link>
                                                        </Tooltip>
                                                    </div>
                                                </div>
                                            </CardFooter>
                                        </Card>
                                    </li>
                                ))}
                            </ul>
                        </div>
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