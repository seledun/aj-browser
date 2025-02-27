'use client'

import { format, parseISO } from "date-fns";
import { fetchComments, fetchVideoCommentCount } from "@/utils/comment-utils";
import Footer from "@/components/footer";
import { useState, useEffect, ChangeEvent } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import { Spinner } from "@nextui-org/spinner";
import { Button } from "@nextui-org/button";
import { fetchVideoName } from "@/utils/video-utils";
import { searchComments } from "@/utils/comment-utils";
import { Input } from "@nextui-org/input";
import Link from "next/link";
import { Video } from "@/utils/video-utils";

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
            const comments = await searchComments(thread, searchTerm, page, limit);
            if (comments !== undefined && comments.length > 0) {
                setComments(comments);
            }
        } else {
            loadComments();
            fetchCommentCount(thread);
        }
        setLoading(false);
    }

    const queryComments = async (loadPage: number): Promise<boolean> => {
        setLoading(true);
        const comments = await searchComments(thread, searchTerm, (limit * loadPage), limit);
        if (comments !== undefined && comments.length > 0) {
            setCommentCount(comments.length);
            setComments(comments);
            setLoading(false);
            return true;
        } else {
            setLoading(false);
            return false;
        }
    }

    const searchEvent = async (ev: ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(ev.target.value);
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
        <div className="h-screen overflow-auto">
            <div className="grid place-items-center grid-cols-3 w-full my-1 text-center sticky top-0 z-40 bg-background p-5 opacity-80 min-w-[250px]">
                <h2 className="text-lg col-span-3">Showing{" " + commentCount} comments for<br></br><b>{title}</b></h2><br />
                <a href={"https://banned.video/watch?id=" + thread} target="_blank" rel="noopener noreferrer">source video link</a>
                <Input onClear={() => clearSearch()} onChange={searchEvent} isClearable size="sm" className="dark col-span-3 content-center my-2 h-10 w-64" label="Search comments"></Input>
                <span className="col-span-3">
                    <Button className="dark mt-2" size="sm" isDisabled={page === 0} onPress={() => prevPage()}>Back</Button>
                    <span className="text-md mx-4">Page {page + 1}</span>
                    <Button className="dark" size="sm" onPress={() => nextPage()}>Next</Button>
                </span>
            </div>
            <div className="flex flex-row items-start justify-center">
                <ul className="grid grid-cols-1 gap-3 max-w-screen-md min-w-[249px]">
                    {
                        !loading ?
                            comments.map((comment, index) => (
                                <li key={comment.id}>
                                    <Card className="dark opacity-0 animate-fade-in" style={{ animationDelay: `${index * 25}ms` }}>
                                        <CardHeader><h2 className="text-lg pt-4 pl-1"><b><Link href={"/user?userId=" + comment.userId}>{comment.username}</Link></b></h2></CardHeader>
                                        <CardBody className="px-6">{comment.content}</CardBody>
                                        <CardFooter>
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