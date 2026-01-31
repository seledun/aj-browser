'use client'

import { format, parseISO } from "date-fns";
import { fetchComments, fetchUserCommentCount, fetchUserComments, fetchUserName } from "@/utils/comment-utils";
import Footer from "@/components/footer";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { Button } from "@heroui/button";
import Link from "next/link";
import { Video } from "@/utils/video-utils";
import { Accordion, AccordionItem } from "@heroui/accordion";

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
        <div className="h-screen overflow-y-auto overflow-x-hidden">
            <div className="flex flex-col gap-3 sticky my-2 top-0 z-40 items-center min-w-[271px] opacity-80">
                <Accordion className="dark max-w-md bg-black" isCompact variant="bordered" defaultExpandedKeys={["1"]}>
                    <AccordionItem key="1" title="Search options" className="text-center">
                        <div className="mb-3 mx-3">
                            <h2>Showing{" " + commentCount} comments for<br></br><b className="text-md font-semibold">{username}</b></h2>
                            <Button className="dark mt-2" size="sm" isDisabled={page === 0} onPress={() => prevPage()}>Back</Button>
                            <span className="text-md mx-4 inline-block text-sm content-center text-center">Page {page + 1}</span>
                            <Button className="dark" size="sm" onPress={() => nextPage()}>Next</Button>
                        </div>
                    </AccordionItem>
                </Accordion>
            </div>
            <div className="flex flex-row items-start justify-center">
                <ul className="grid grid-cols-1 gap-3 max-w-(--breakpoint-md) min-w-[249px]">
                    {
                        !loading ?
                            comments.map((comment, index) => (
                                <li key={comment.id}>
                                    <Card className="dark opacity-0 animate-fade-in" style={{ animationDelay: `${index * 25}ms` }}>
                                        <CardHeader className="grid grid-cols-1"><h2 className="text-lg pt-4 pl-1"><b>{comment.username}</b></h2>
                                            <div className="text-sm pl-1 pt-1"><b><Link className="no-underline" href={"/video?videoId=" + comment.videoId}>{comment.video?.title}</Link></b>
                                            </div>
                                        </CardHeader>
                                        <CardBody className="px-6">{comment.content}</CardBody>
                                        <CardFooter className="grid cols-1">
                                            <ul className="w-full flex justify-evenly text-center text-sm">
                                                <li>Posted<br></br><b>{format(parseISO(comment.createdAt), "yy/MM/dd HH:mm")}</b></li>
                                                <li>Likes<br></br><b>{comment.posVotes}</b></li>
                                                <li>Replies<br></br><b>{comment.replyCount}</b></li>
                                            </ul>
                                        </CardFooter>
                                    </Card>
                                </li>
                            ))
                            :
                            <Spinner></Spinner>
                    }
                </ul>
            </div>
            <Footer />
        </div>
    )
}