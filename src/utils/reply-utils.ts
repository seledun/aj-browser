export interface Reply {
    id: string,
    content: string,
    liked: string,
    userId: string,
    userName: string,
    voteCount: number,
    linkedUserName: string | null,
    linkedUserId: string | null,
    createdAt: string,
    replyTo: number,
    comment?: Comment
}

export const fetchReplyCount = async() => {
    try {
        const response = await fetch(`/api/reply/count`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error("Failed to fetch count.", error);
        return undefined;
    }
}

export const fetchCommentReplies = async(commentId: string) => {
    try {
        const response = await fetch(`/api/reply/replies?commentId=` + commentId);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error("Failed to fetch replies.", error);
        return undefined;
    }
}

export const getReplyById = async(replyId: string) => {
    try {
        const response = await fetch(`/api/reply/by-id?replyId=` + replyId);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error("Failed to fetch reply by ID.", error);
        return undefined;
    }
}