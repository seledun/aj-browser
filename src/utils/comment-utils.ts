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
        const response = await fetch(`/api/comments/count`);
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
        const response = await fetch(`/api/comments/count?userId=` + userId);
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
        const response = await fetch(`/api/comments/count?videoId=` + videoId);
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
        const response = await fetch(`/api/users/` + id + `/username`);
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
        const response = await fetch(`/api/videos/${video}/comments?start=${start}&limit=${limit}`);
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
        const response = await fetch(`/api/comments?start=${start}&limit=${limit}&orderBy=${props.orderBy}&desc=${props.desc}`);
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
        const response = await fetch(`/api/comments?search=${str}&start=${start}&limit=${limit}&orderBy=${props.orderBy}&desc=${props.desc}`);
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
        const response = await fetch(`/api/videos/${video}/comments/&start=${start}&limit=${limit}&search=${search}`);
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
        const response = await fetch(`/api/comments?userId=${user}&start=${start}&limit=${limit}`);
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

export const getCommentById = async (id: string): Promise<Comment | undefined> => {
    try {
        const response = await fetch(`/api/comments/${id}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch comment:", error);
        return undefined;
    }
};