'use client'

import { format, parseISO } from "date-fns";
import { fetchComments, fetchVideoCommentCount } from "@/utils/comment-utils";
import Footer from "@/components/Footer";
import { useState, useEffect, ChangeEvent } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { Button } from "@heroui/button";
import { Checkbox } from "@heroui/checkbox";
import { fetchVideoName } from "@/utils/video-utils";
import { searchComments } from "@/utils/comment-utils";
import { Input } from "@heroui/input";
import { Link, Tooltip } from "@heroui/react";
import { Video } from "@/utils/video-utils";
import { Divider } from "@heroui/react";
import { Accordion, AccordionItem } from "@heroui/accordion";
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
    const [thread, setThread] = useState<string>("");
    const [title, setTitle] = useState<string>("");
    const [commentCount, setCommentCount] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [searchMode, setSearchMode] = useState<boolean>(false);
    const [strictMode, setStrictMode] = useState<boolean>(false);

    const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
    const [replyDrawerOpen, setReplyDrawerOpen] = useState<boolean>(false);

    useEffect(() => {
        const ret = new URLSearchParams(window.location.search).get('videoId');
        if (ret !== null && ret !== "") {
            setThread(ret);
        }
    }, []);

    useEffect(() => {
        if (thread !== "") {
            loadComments();
            fetchTitle(thread);
            fetchCommentCount(thread);
        }
    }, [thread]);

    useEffect(() => {
        if (thread !== "") {
            currentPage();
        }
    }, [searchMode]);

    useEffect(() => {
        const loadVideos = async () => {
            setSearchMode(true);
            if (searchTerm.length > 1) {
                setSearchMode(true);
                queryComments(0);
                setPage(0);
            } else {
                setSearchMode(false);
                currentPage();
            }
        }
        loadVideos();
    }, [searchTerm, strictMode]);

    const limit = 25;

    const fetchCommentCount = async (videoId: string) => {
        const count = await fetchVideoCommentCount(videoId);
        if (count !== undefined) {
            setCommentCount(count);
        }
    }

    const fetchTitle = async (id: string) => {
        const name = await fetchVideoName(id);
        console.log(name);
        if (typeof name === 'string') {
            setTitle(name);
        }
    }

    const loadComments = async () => {
        setLoading(true);
        if (typeof thread === 'string') {
            const resp = await fetchComments(thread, (page * limit), limit);
            if (resp !== undefined) {
                setComments(resp);
            }
        }
        setLoading(false);
    }

    const currentPage = async () => {
        setLoading(true);
        if (searchMode) {
            const search = strictMode ? ' ' + searchTerm + ' ' : searchTerm;
            const comments = await searchComments(thread, search, page, limit);
            if (comments !== undefined && comments.length > 0) {
                setComments(comments);
            }
        }
        setLoading(false);
    }

    const queryComments = async (loadPage: number): Promise<boolean> => {
        setLoading(true);
        const search = strictMode ? ' ' + searchTerm + ' ' : searchTerm;
        const comments = await searchComments(thread, search, (limit * loadPage), limit);

        if (comments !== undefined && comments.length > 0) {
            setCommentCount(comments.length);
            setComments(comments);
            setLoading(false);
            return true;
        }

        else if (strictMode) {
            setComments([]);
            setCommentCount(0);
            setLoading(false);
            return false;
        }

        else {
            setLoading(false);
            return false;
        }
    }

    const searchEvent = async (ev: ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(ev.target.value);
    }

    const clearSearch = () => {
        setPage(0);
        setSearchMode(false);
        setSearchTerm("");
    }

    const nextPage = async () => {
        setLoading(true);
        if (searchMode) {
            const ret = await queryComments(page + 1);
            if (ret) {
                setPage(page + 1);
            }
        } else {
            if (typeof thread === 'string') {
                const resp = await fetchComments(thread, (page + 1) * limit, limit);
                if (resp !== undefined) {
                    setComments(resp);
                    setPage(page + 1);
                }
            }
        }
        setLoading(false);
    }

    const prevPage = async () => {
        if (page > 0) {
            setLoading(true);
            if (searchMode) {
                const ret = await queryComments(page - 1);
                if (ret) {
                    setPage(page - 1);
                }
            } else {
                if (typeof thread === 'string') {
                    const resp = await fetchComments(thread, (page - 1) * limit, limit);
                    if (resp !== undefined) {
                        setPage(page - 1);
                        setComments(resp);
                    }
                }
            }
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col">
            <div className="flex flex-col gap-6 items-center w-full px-4 pb-4">

                {/* Search & Header Section */}
                <Accordion
                    className="sticky top-18 z-40 w-full max-w-2xl"
                    variant="shadow"
                    isCompact
                >
                    <AccordionItem
                        key="1"
                        title={
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-default-600">
                                    {strictMode ? "(Strict) " : ""}Showing {commentCount} comments
                                </span>
                                <span className="text-small font-bold line-clamp-2 max-w-xs sm:max-w-md">
                                    {title}
                                </span>
                            </div>
                        }
                    >
                        <div className="flex flex-col gap-4 p-4 pt-0">
                            <div className="flex justify-between items-center">
                                <Link
                                    isExternal
                                    showAnchorIcon
                                    size="sm"
                                    href={"https://banned.video/watch?id=" + thread}
                                    className="text-primary font-medium"
                                >
                                    View Source on banned.video
                                </Link>
                            </div>

                            <Input
                                onClear={() => clearSearch()}
                                onChange={searchEvent}
                                isClearable
                                size="md"
                                label="Search in this thread"
                                variant="flat"
                            />

                            <div className="flex flex-wrap items-center justify-between gap-4">
                                {/* Pagination Group */}
                                <div className="flex items-center gap-2">
                                    <Button isIconOnly size="sm" variant="flat" isDisabled={page === 0} onPress={() => prevPage()}>‹</Button>
                                    <span className="text-tiny font-semibold px-2">Page {page + 1}</span>
                                    <Button isIconOnly size="sm" variant="flat" onPress={() => nextPage()}>›</Button>
                                </div>

                                {/* Toggles Group */}
                                <div className="flex gap-4">
                                    <Checkbox onValueChange={setStrictMode} isSelected={strictMode} size="sm" color="warning">
                                        Strict
                                    </Checkbox>
                                    <Checkbox isDisabled size="sm">
                                        Desc.
                                    </Checkbox>
                                </div>
                            </div>
                        </div>
                    </AccordionItem>
                </Accordion>

                {/* Comments Feed Section */}
                <main className="w-full max-w-3xl mx-auto">
                    {!loading ? (
                        <div>
                            {/* Only render the drawer if selectedComment is not null */}
                            {selectedComment && (
                                <CommentReplyDrawer
                                    isOpen={replyDrawerOpen}
                                    onClose={() => setReplyDrawerOpen(false)}
                                    parent={selectedComment}
                                />
                            )}
                            <ul className="flex flex-col gap-4 list-none">
                                {comments.map((comment) => (
                                    <li key={comment.id}>
                                        <Card className="border-none bg-content1 shadow-sm" radius="lg" isHoverable>
                                            <CardHeader className="flex gap-3 px-6 pt-5">
                                                <div className="flex flex-col">
                                                    <Link
                                                        className="text-md font-bold text-primary no-underline!"
                                                        href={"/user?userId=" + comment.userId}
                                                    >
                                                        {comment.username}
                                                    </Link>
                                                </div>
                                            </CardHeader>

                                            <CardBody className="px-6 py-2 text-default-700 leading-relaxed">
                                                <p className="whitespace-pre-wrap">{comment.content}</p>
                                            </CardBody>

                                            <Divider className="my-2" />

                                            <CardFooter className="px-6 pb-5">
                                                <div className="flex justify-between w-full text-tiny text-default-400">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold uppercase tracking-tighter">Posted</span>
                                                        <span>{format(parseISO(comment.createdAt), "yy/MM/dd HH:mm")}</span>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-bold uppercase tracking-tighter">Likes</span>
                                                        <span className="font-mono text-success-600">{comment.posVotes}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-bold uppercase tracking-tighter">Replies</span>
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
                                                    {/* NEW Column 4: Share (Single View) */}
                                                    <div className="flex flex-col items-end justify-center">
                                                        <Tooltip content="Open Single View" delay={500}>
                                                            <Link
                                                                href={`/comments/single-comment?commentId=${comment.id}`}
                                                                className="text-default-400 hover:text-primary transition-colors"
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    strokeWidth={2}
                                                                    stroke="currentColor"
                                                                    className="w-5 h-5"
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
                        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                            <Spinner size="lg" />
                            <p className="text-default-400 animate-pulse">Loading thread...</p>
                        </div>
                    )}
                </main>
            </div>
        </div>

    )
}