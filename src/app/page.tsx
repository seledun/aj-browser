'use client'

import { useState, useEffect, ChangeEvent, useMemo, useRef } from "react";
import { Button } from "@heroui/button";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Spinner } from "@heroui/spinner";
import { Checkbox } from "@heroui/checkbox";
import { Input } from "@heroui/input";
import { SearchProps } from "../utils/video-utils";
import Footer from "@/components/Footer";

import { Video, fetchVideos, fetchVideoSearch } from "../utils/video-utils";
import { Link } from "@heroui/react";
import { Divider, SharedSelection } from "@heroui/react";
import { Accordion, AccordionItem } from "@heroui/accordion";
import VideoCard from "@/components/Cards/VideoCard";

const sortBy = [
  'Anger',
  'Comments',
  'Date',
  'Likes',
  'Runtime',
  'Views'
]

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchProps, setSearchProps] = useState<SearchProps>({ orderBy: "Date", desc: true });
  const [strictMode, setStrictMode] = useState<boolean>(false);
  const [sortDesc, setSortDesc] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);

  const [sortBySelection, setSortBySelection] = useState(new Set(["Sort by"]));

  const [searchMode, setSearchMode] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const isFirstRender = useRef(true);

  const selectedValue = useMemo(
    () => Array.from(sortBySelection).join(", ").replaceAll("_", " "),
    [sortBySelection]
  );

  const limit = 21; // cards per page

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const searchVideos = async () => {
      if (searchTerm.length > 1) {
        setSearchMode(true);
        setPage(0);
        setLoading(true);

        const search = strictMode ? ' ' + searchTerm + ' ' : searchTerm;
        const videos = await fetchVideoSearch(search, page, limit, searchProps);

        if (videos !== undefined && videos.length > 0) {
          setVideos(videos);
        }

        else if (strictMode) {
          setVideos([]);
          setPage(0);
          setLoading(false);
        }

        setLoading(false);
      } else {
        setSearchMode(false);
        currentPage();
      }
    }
    searchVideos();
  }, [searchTerm, strictMode])

  const toggleSortingOrder = async () => {
    setSearchProps({
      orderBy: searchProps.orderBy,
      desc: !sortDesc
    });

    setSortDesc(!sortDesc);
    setPage(0);
  }

  const nextPage = async () => {
    setLoading(true);
    if (searchMode) {
      const search = strictMode ? ' ' + searchTerm + ' ' : searchTerm;
      const videos = await fetchVideoSearch(search, (page + 1) * limit, limit, searchProps);
      if (videos !== undefined && videos.length > 0) {
        setPage(page + 1);
        setVideos(videos);
      }

    } else {
      const videos = await fetchVideos((page + 1) * limit, limit, searchProps);
      if (videos !== undefined) {
        setPage(page + 1);
        setVideos(videos);
      }
    }

    setLoading(false);
  }

  const prevPage = async () => {
    if (page > 0) {
      setLoading(true);
      if (searchMode) {
        const search = strictMode ? ' ' + searchTerm + ' ' : searchTerm;
        const videos = await fetchVideoSearch(search, (page - 1) * limit, limit, searchProps);
        if (videos !== undefined && videos.length > 0) {
          setPage(page - 1);
          setVideos(videos);
        }

      } else {
        const videos = await fetchVideos((page - 1) * limit, limit, searchProps);
        if (videos !== undefined) {
          setPage(page - 1);
          setVideos(videos);
        }
      }

      setLoading(false);
    }
  }

  const currentPage = async () => {
    setLoading(true);
    if (searchMode) {
      const search = strictMode ? ' ' + searchTerm + ' ' : searchTerm;
      const videos = await fetchVideoSearch(search, page, limit, searchProps);
      if (videos !== undefined && videos.length > 0) {
        setVideos(videos);
      }
    } else {
      const videos = await fetchVideos(page, limit, searchProps);
      if (videos !== undefined && videos.length > 0) {
        setVideos(videos);
      }
    }
    setLoading(false);
  }

  const searchVideos = async (ev: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(ev.target.value);
  }

  const updateSortBySelection = (ev: SharedSelection) => {
    if (typeof ev.currentKey === 'string') {
      setSortBySelection(new Set([ev.currentKey]));
      setSearchProps({ orderBy: ev.currentKey, desc: sortDesc });
      setPage(0);
    }
  }

  useEffect(() => {
    currentPage();
  }, [searchProps]);

  const clearSearch = () => {
    setSearchMode(false);
    setSearchTerm("");
    currentPage();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-col gap-3 items-center w-full px-4">
        <Accordion
          className="sticky mt-2 top-0 z-40 w-full max-w-2xl mx-auto" // Slightly wider for better breathing room
          variant="shadow" // Shadow variant feels more premium in HeroUI
          isCompact
        >
          <AccordionItem
            key="1"
            aria-label="Search Options"
            title={
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Video Search</span>
                {!loading && (
                  <span className="text-tiny bg-default-100 px-2 py-0.5 rounded-full text-default-600">
                    {searchTerm ? `"${searchTerm}"` : "All videos"} ({videos.length})
                  </span>
                )}
              </div>
            }
          >
            <div className="flex flex-col gap-6 p-4 pt-0">
              <div className="flex gap-2">
                <Input
                  isClearable
                  fullWidth
                  onClear={() => clearSearch()}
                  onChange={searchVideos}
                  placeholder="Search videos..."
                  variant="flat"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex gap-2 items-center">
                  <Dropdown>
                    <DropdownTrigger>
                      <Button
                        variant="bordered"
                        size="sm"
                        className="w-full justify-between"
                      >
                        Sort by: {selectedValue}
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu
                      disallowEmptySelection
                      selectionMode="single"
                      selectedKeys={sortBySelection}
                      onSelectionChange={updateSortBySelection}
                    >
                      {sortBy.map((val) => (
                        <DropdownItem key={val}>{val}</DropdownItem>
                      ))}
                    </DropdownMenu>
                  </Dropdown>

                  <Checkbox
                    onValueChange={toggleSortingOrder}
                    defaultSelected
                    size="sm"
                    color="primary"
                  >
                    Desc
                  </Checkbox>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1">
                    <Button isIconOnly size="sm" variant="flat" isDisabled={page === 0} onPress={() => prevPage()}>‹</Button>
                    <span className="text-tiny font-semibold px-2 min-w-15 text-center">Page {page + 1}</span>
                    <Button isIconOnly size="sm" variant="flat" onPress={() => nextPage()}>›</Button>
                  </div>
                  <Checkbox
                    onValueChange={setStrictMode}
                    size="sm"
                    isSelected={strictMode}
                    color="warning"
                  >
                    Strict
                  </Checkbox>
                </div>
              </div>
              <Divider />
              <div className="flex justify-center">
                <Link
                  showAnchorIcon
                  href="/comments"
                  className="text-default-500 hover:text-primary transition-colors"
                >
                  Browse all comments
                </Link>
              </div>
            </div>
          </AccordionItem>
        </Accordion>
        <main className="w-full mx-auto mb-8">
          {loading ? (
            <div className="flex justify-center items-center h-[60vh] w-full">
              <Spinner size="lg" />
            </div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
              {videos.map((video, index) => (
                <li key={index} className="list-none">
                  <VideoCard video={video} />
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}
