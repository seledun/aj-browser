'use client'

import { fetchCommentCount } from "@/utils/comment-utils";
import { fetchLastUpdated } from "@/utils/updated-utils";
import { fetchReplyCount } from "@/utils/reply-utils";
import { fetchVideoCount } from "@/utils/video-utils";
import { format, parseISO } from "date-fns";
import { createContext, useState, useContext, useEffect, ReactNode } from "react";

interface ArchiveStatistics {
    videoCount: number,
    commentCount: number,
    replyCount: number,
    lastUpdated: string
}

interface ArchiveStatisticsContextType {
    archiveStatistics: ArchiveStatistics | null
}

const ArchiveStatisticsContext = createContext<ArchiveStatisticsContextType | null>(null);

export const ArchiveStatisticsProvider: React.FC<{ children : ReactNode }> = ({ children }) => {
    
    const [archiveStatistics, setArchiveStatistics] = useState<ArchiveStatistics>({
        videoCount: 0,
        commentCount: 0,
        replyCount: 0,
        lastUpdated: ""
    });

    useEffect(() => {
        getVideoCount();
        getCommentCount();
        getReplyCount();
        getLastUpdated();
    }, []);

    const getVideoCount = async () => {
        const videos = await fetchVideoCount();
        if (videos !== undefined) {
            setArchiveStatistics((prevState) => ({
                ...prevState,
                videoCount: videos,
            }));
        }
    }

    const getReplyCount = async () => {
        const replies = await fetchReplyCount();
        if (replies !== undefined) {
            setArchiveStatistics((prevState) => ({
                ...prevState,
                replyCount: replies,
            }));
        }
    }

    const getCommentCount = async () => {
        const comments = await fetchCommentCount();
        if (comments !== undefined) {
            setArchiveStatistics((prevState) => ({
                ...prevState,
                commentCount: comments,
            }));
        }
    }

    const getLastUpdated = async () => {
        const lastUpdated = await fetchLastUpdated();
        if (lastUpdated !== undefined) {
            setArchiveStatistics((prevState) => ({
                ...prevState,
                lastUpdated: format(parseISO(lastUpdated), "yy/MM/dd HH:mm:ss"),
            }));
        }
    }

    return (
        <ArchiveStatisticsContext.Provider value={{ archiveStatistics }}>
            { children }
        </ArchiveStatisticsContext.Provider>
    );
};

export const useArchiveStatisticsData = (): ArchiveStatisticsContextType => {
    const context = useContext(ArchiveStatisticsContext);
    if (!context) {
        throw new Error('useArchiveStatisticsData needs to be used with in a provider.');
    } 
    return context;
}