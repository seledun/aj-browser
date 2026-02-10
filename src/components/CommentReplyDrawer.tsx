import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from "@heroui/drawer"
import { useCommentReplyDrawer } from "@/hooks/useCommentReplyDrawer";
import { Comment } from "@/utils/comment-utils";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Button, Link, Tooltip } from "@heroui/react";
import { format, parseISO } from "date-fns";

export interface CommentReplyDrawerProps {
    isOpen: boolean;
    parent: Comment | null;
    onClose: () => void;
}

export default function CommentReplyDrawer(props: CommentReplyDrawerProps) {
    const { isOpen, parent } = props;
    const { onClose, replyList } = useCommentReplyDrawer(props);

    return (
        <Drawer size="xl" isOpen={isOpen} onClose={onClose} scrollBehavior="inside">
            <DrawerContent>
                <DrawerHeader>
                    Replies to comment by {parent?.username}
                </DrawerHeader>
                <DrawerBody>
                    <Card className="p-4 shrink-0 bg-zinc-800">
                        <CardHeader>
                            <Link href={`/user?userId=${parent?.userId}`}>{parent?.username}</Link>
                        </CardHeader>
                        <CardBody>{parent?.content}</CardBody>
                        <CardFooter>
                            <div className="flex flex-col text-tiny text-default-500">
                                <span className="font-bold uppercase tracking-tighter">Posted</span>
                                <span>{format(parseISO(parent?.createdAt || ""), "yy/MM/dd HH:mm")}</span>
                            </div>
                        </CardFooter>
                    </Card>
                    {replyList.map((reply) => (
                        <Card className="mt-4 p-4 shrink-0" key={reply.id}>
                            <CardHeader>
                                <Link href={`/user?userId=${reply.userId}`}>{reply.userName}</Link>
                            </CardHeader>
                            <CardBody>
                                <p>
                                    {reply.linkedUserName && (
                                        <Link
                                            href={`/user?userId=${reply.linkedUserId}`}
                                            className="text-primary font-semibold mr-1 no-underline!"
                                        >
                                            @{reply.linkedUserName}
                                        </Link>
                                    )}
                                    {reply.content}
                                </p>
                            </CardBody>
                            <CardFooter className="flex justify-between items-center border-t border-default-100 pt-3">
                                <div className="flex flex-col text-tiny text-default-500">
                                    <span className="font-bold uppercase tracking-tighter">Posted</span>
                                    <span>{format(parseISO(reply.createdAt || ""), "yy/MM/dd HH:mm")}</span>
                                </div>

                                <div className="flex flex-col items-end">
                                    <span className="font-bold uppercase tracking-tighter text-[10px] text-default-400">Share</span>
                                    <Tooltip content="Link to this reply" delay={500}>
                                        <Link
                                            href={`/replies/${reply.id}/`}
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
                            </CardFooter>
                        </Card>
                    ))}
                </DrawerBody>
                <DrawerFooter>
                    <Button color="primary" onPress={onClose}>Close</Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}