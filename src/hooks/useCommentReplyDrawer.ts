import { CommentReplyDrawerProps } from "@/components/CommentReplyDrawer";
import { Comment } from "@/utils/comment-utils";
import { fetchCommentReplies, Reply } from "@/utils/reply-utils";
import { useEffect, useState } from "react";

export function useCommentReplyDrawer(parent: CommentReplyDrawerProps) {

    const [replyList, setReplyList] = useState<Array<Reply>>([]);

    useEffect(() => {
        if (parent.isOpen && parent.parent !== null) {
            fetchCommentReplies(parent.parent.id).then((replies: Reply[] | undefined) => {
                if (replies !== undefined) {
                    setReplyList(replies);
                    console.log("Fetched replies:", replies);
                } else {
                    console.log("No replies found for comment:", parent.parent);
                }
            }).catch((error) => {
                console.error("Failed to fetch replies for comment:", parent.parent, error);
            });
            console.log("Fetching replies for comment:", parent.parent);
        }
    }, [parent.isOpen, parent.parent]);

    return {
        isOpen: parent.isOpen,
        onClose: parent.onClose,
        replyList: replyList,
    };
}