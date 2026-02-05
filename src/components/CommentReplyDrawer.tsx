import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from "@heroui/drawer"
import { useCommentReplyDrawer } from "@/hooks/useCommentReplyDrawer";
import { Comment } from "@/utils/comment-utils";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Button, Link } from "@heroui/react";
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
                                            className="text-primary font-semibold mr-1"
                                        >
                                            @{reply.linkedUserName}:
                                        </Link>
                                    )}
                                    {reply.content}
                                </p>
                            </CardBody>
                            <CardFooter>
                                <div className="flex flex-col text-tiny text-default-500">
                                    <span className="font-bold uppercase tracking-tighter">Posted</span>
                                    <span>{format(parseISO(reply.createdAt || ""), "yy/MM/dd HH:mm")}</span>
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