export interface Video {
    id: string,
    title: string,
    summary: string,
    playCount: number,
    likeCount: number,
    angerCount: number,
    duration?: number,
    createdAt: string,
    commentCount: number
}

export interface SearchProps {
    orderBy: string,
    desc: boolean
}

export const fetchVideoCount = async() => {
    try {
        const response = await fetch(`/api/video/count`);
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

export const fetchVideoName = async(id: string) => {
    try {
        const response = await fetch(`/api/video/name?videoId=` + id);
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

export const fetchVideos = async (start: number, limit: number, props: SearchProps): Promise<Video[] | undefined> => {
    try {
        const response = await fetch(`/api/video/videos?start=${start}&limit=${limit}&orderBy=${props.orderBy}&desc=${props.desc}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch videos:", error);
        return undefined;
    }
};

export const fetchVideoSearch = async (str: string, start: number, limit: number, props: SearchProps): Promise<Video[] | undefined> => {
    try {
        const response = await fetch(`/api/video/videos?search=${str}&start=${start}&limit=${limit}&orderBy=${props.orderBy}&desc=${props.desc}`);
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