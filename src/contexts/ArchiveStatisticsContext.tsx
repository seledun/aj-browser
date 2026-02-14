'use client'

import { fetchCommentCount } from "@/utils/comment-utils";
import { fetchLastUpdated } from "@/utils/updated-utils";
import { fetchReplyCount } from "@/utils/reply-utils";
import { fetchVideoCount } from "@/utils/video-utils";
import { format, parseISO } from "date-fns";
import { createContext, useState, useContext, useEffect, ReactNode, useCallback } from "react";

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

export const ArchiveStatisticsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

    const [archiveStatistics, setArchiveStatistics] = useState<ArchiveStatistics>({
        videoCount: 0,
        commentCount: 0,
        replyCount: 0,
        lastUpdated: ""
    });

    useEffect(() => {
        let ignore = false;
        async function startFetching() {
            try {
                const [videos, comments, replies, updated] = await Promise.all([
                    fetchVideoCount(),
                    fetchCommentCount(),
                    fetchReplyCount(),
                    fetchLastUpdated(),
                ]);

                if (!ignore) {
                    setArchiveStatistics({
                        videoCount: videos ?? 0,
                        commentCount: comments ?? 0,
                        replyCount: replies ?? 0,
                        lastUpdated: updated ? format(parseISO(updated), "yy/MM/dd HH:mm:ss") : ""
                    });
                }
            } catch (err) {
                console.error("Fetch failed", err);
            }
        }
        startFetching();
        return () => {
            ignore = true;
        };
    }, []);

    return (
        <ArchiveStatisticsContext.Provider value={{ archiveStatistics }}>
            {children}
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