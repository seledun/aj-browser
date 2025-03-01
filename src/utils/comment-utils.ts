import { Video } from "./video-utils";

export interface Comment {
    id: string,
    videoId: string,
    content: string,
    userId: string,
    username: string,
    posVotes: number,
    createdAt: string,
    replyCount: number
    video?: Video
}

export interface SearchProps {
    orderBy: string,
    desc: boolean
}

export const fetchCommentCount = async() => {
    try {
        const response = await fetch(`/api/comment/count`);
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

export const fetchUserCommentCount = async(userId: string) => {
    try {
        const response = await fetch(`/api/comment/count?userId=` + userId);
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

export const fetchVideoCommentCount = async(videoId: string) => {
    try {
        const response = await fetch(`/api/comment/count?videoId=` + videoId);
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

export const fetchUserName = async(id: string) => {
    try {
        const response = await fetch(`/api/comment/username/?userId=` + id);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error("Failed to fetch name.", error);
        return undefined;
    }
}

export const fetchComments = async (video: string, start: number, limit: number): Promise<Comment[] | undefined> => {
    try {
        const response = await fetch(`/api/comment/comments?videoId=${video}&start=${start}&limit=${limit}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch comments:", error);
        return undefined;
    }
};

export const searchAllComments = async (start: number, limit: number, props: SearchProps): Promise<Comment[] | undefined> => {
    try {
        const response = await fetch(`/api/comment/comments?start=${start}&limit=${limit}&orderBy=${props.orderBy}&desc=${props.desc}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch comments:", error);
        return undefined;
    }
};

export const searchAllCommentsTerms = async (str: string, start: number, limit: number, props: SearchProps): Promise<Comment[] | undefined> => {
    try {
        const response = await fetch(`/api/comment/comments?search=${str}&start=${start}&limit=${limit}&orderBy=${props.orderBy}&desc=${props.desc}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch videos:", error);
        return undefined;
    }
}

export const searchComments = async (video: string, search: string, start: number, limit: number): Promise<Comment[] | undefined> => {
    try {
        const response = await fetch(`/api/comment/comments?videoId=${video}&start=${start}&limit=${limit}&search=${search}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch comments:", error);
        return undefined;
    }
};

export const fetchUserComments = async (user: string, start: number, limit: number): Promise<Comment[] | undefined> => {
    try {
        const response = await fetch(`/api/comment/comments?userId=${user}&start=${start}&limit=${limit}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch comments:", error);
        return undefined;
    }
};