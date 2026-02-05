'use client';

import { useArchiveStatisticsData } from "@/contexts/ArchiveStatisticsContext";
import { Spinner } from "@heroui/spinner";
import { Link, Divider } from "@heroui/react";

export default function Footer() {
  const { archiveStatistics } = useArchiveStatisticsData();

  return (
    <footer className="w-full mt-auto border-t border-divider bg-background/70 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* Branding & Attribution */}
        <div className="flex flex-col items-center md:items-start gap-1">
          <p className="text-sm text-default-500">
            Archive of{" "}
            <Link isExternal href="https://banned.video" className="font-semibold text-primary">
              banned.video
            </Link>
          </p>
          <p className="text-tiny text-default-400">
            Built by{" "}
            <Link isExternal href="https://github.com/seledun" color="foreground" className="underline underline-offset-4">
              @sl3dev
            </Link>
          </p>
        </div>

        <Divider className="md:hidden" />

        {/* Statistics Section */}
        <div className="flex-1 max-w-2xl w-full">
          {archiveStatistics !== null ? (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
              <StatItem label="Videos" value={archiveStatistics.videoCount.toLocaleString()} />
              <StatItem label="Comments" value={archiveStatistics.commentCount.toLocaleString()} />
              <StatItem label="Replies" value={archiveStatistics.replyCount.toLocaleString()} />
              <StatItem label="Last update" value={archiveStatistics.lastUpdated} />
            </div>
          ) : (
            <div className="flex justify-center">
              <Spinner size="sm" color="default" label="Loading stats..." />
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

// Small helper component for consistent stats styling
function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-tiny uppercase tracking-wider text-default-400 font-bold">
        {label}
      </span>
      <span className="text-sm font-mono text-default-700">
        {value}
      </span>
    </div>
  );
}