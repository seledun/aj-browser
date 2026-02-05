import { useArchiveStatisticsData } from "@/contexts/ArchiveStatisticsContext";
import { Spinner } from "@heroui/spinner";
import { Link } from "@heroui/react";

export default function Footer() {

    const { archiveStatistics } = useArchiveStatisticsData();

    return (
        <div className="w-screen items-center text-sm inset-x-0 bottom-0 grid grid-cols-2 bg-black mt-2 z-40 min-w-[289px]">
            <span className="m-8 text-center">Archive of <Link href="https://banned.video">banned.video</Link><br></br>
                by <Link href="https://github.com/seledun">@sl3dev</Link><br></br>
            </span>
            {
                archiveStatistics !== null ?
                    <span className="m-8 text-center grid md:grid-cols-3 grid-cols-1">
                        <span>Videos<br></br><b>{archiveStatistics.videoCount}</b></span>
                        <span>Comments<br></br><b>{archiveStatistics.commentCount}</b></span>
                        <span>Last update<br></br><b>{archiveStatistics.lastUpdated}</b></span>
                    </span>
                    :
                    <Spinner></Spinner>
            }

        </div>
    );
}