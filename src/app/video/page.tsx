'use client'

import { format, parseISO } from "date-fns";
import { fetchComments, fetchVideoCommentCount } from "@/utils/comment-utils";
import Footer from "@/components/footer";
import { useState, useEffect, ChangeEvent } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { Button } from "@heroui/button";
import { Checkbox } from "@heroui/checkbox";
import { fetchVideoName } from "@/utils/video-utils";
import { searchComments } from "@/utils/comment-utils";
import { Input } from "@heroui/input";
import Link from "next/link";
import { Video } from "@/utils/video-utils";
import { HeroUIProvider, SharedSelection } from "@heroui/react";
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
    const [thread, setThread] = useState<string>("");
    const [title, setTitle] = useState<string>("");
    const [commentCount, setCommentCount] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [searchMode, setSearchMode] = useState<boolean>(false);
    const [strictMode, setStrictMode] = useState<boolean>(false);

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
        <HeroUIProvider>
            <div>
                <div>
                    <Accordion defaultExpandedKeys={["1"]}>
                        <AccordionItem key="1" title="Search options" className="">
                            <div className="p-6 text-center">
                                <h2>{strictMode ? "(strict) " : ""}Showing{" " + commentCount} comments for<div className="text-md font-semibold">{title}</div></h2><br />
                                <Link className="no-underline m-2 text-sm" href={"https://banned.video/watch?id=" + thread} target="_blank" rel="noopener noreferrer">Source link</Link>
                                <Input onClear={() => clearSearch()} onChange={searchEvent} isClearable size="sm" label="Search comments"></Input>
                                    <Button size="sm" isDisabled={page === 0} onPress={() => prevPage()}>Back</Button>
                                    <Button size="sm" onPress={() => nextPage()}>Next</Button>
                                    <Checkbox onValueChange={setStrictMode}>Strict</Checkbox>
                                    <Checkbox isDisabled>Desc.</Checkbox>
                            </div>
                        </AccordionItem>
                    </Accordion>
                </div>
                <div>
                    <ul>
                        {
                            !loading ?
                                comments.map((comment, index) => (
                                    <li key={comment.id}>
                                        <Card radius="lg">
                                            <CardHeader><h2 className="text-lg pt-4 pl-1"><b><Link className="no-underline" href={"/user?userId=" + comment.userId}>{comment.username}</Link></b></h2></CardHeader>
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
        </HeroUIProvider>
    )
}