'use client'

import { format, parseISO } from "date-fns";
import { fetchComments, fetchVideoCommentCount } from "@/utils/comment-utils";
import Footer from "@/components/footer";
import { useState, useEffect, ChangeEvent } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import { Spinner } from "@nextui-org/spinner";
import { Button } from "@nextui-org/button";
import { Checkbox } from "@nextui-org/checkbox";
import { fetchVideoName } from "@/utils/video-utils";
import { searchComments } from "@/utils/comment-utils";
import { Input } from "@nextui-org/input";
import Link from "next/link";
import { Video } from "@/utils/video-utils";
import { NextUIProvider, SharedSelection } from "@nextui-org/system";
import { Accordion, AccordionItem } from "@nextui-org/accordion";

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
        <NextUIProvider>
            <div className="h-screen overflow-y-auto overflow-x-hidden">
                <div className="flex flex-col gap-3 sticky my-2 top-0 z-40 items-center min-w-[271px] opacity-80">
                    <Accordion className="dark max-w-md bg-black" isCompact variant="bordered" defaultExpandedKeys={["1"]}>
                        <AccordionItem key="1" title="Search options" className="">
                            <div className="grid grid-cols-3 gap-2 bg-black rounded-b-2xl p-6 bg-background opacity-90 text-center">
                                <h2 className="col-span-3 max-w-(--breakpoint-sm)">{strictMode ? "(strict) " : ""}Showing{" " + commentCount} comments for<div className="col-span-3 text-md font-semibold mt-2">{title}</div></h2><br />
                                <Link className="no-underline m-2 text-sm" href={"https://banned.video/watch?id=" + thread} target="_blank" rel="noopener noreferrer">Source link</Link>
                                <Input onClear={() => clearSearch()} onChange={searchEvent} isClearable size="sm" className="dark col-span-3 content-center my-2 h-10 w-64 justify-self-center" label="Search comments"></Input>
                                <span className="col-span-3 justify-self-center">   
                                    <Button className="dark mt-2" size="sm" isDisabled={page === 0} onPress={() => prevPage()}>Back</Button>
                                    <span className="text-md mx-4 inline-block text-sm content-center text-center">Page {page + 1}</span>
                                    <Button className="dark" size="sm" onPress={() => nextPage()}>Next</Button>
                                </span>
                                <span className="col-span-3 justify-evenly mt-2">
                                    <Checkbox className="mr-1" onValueChange={setStrictMode} size="sm">Strict</Checkbox>
                                    <Checkbox isDisabled size="sm">Desc.</Checkbox>
                                </span>
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
        </NextUIProvider>
    )
}