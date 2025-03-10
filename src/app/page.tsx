'use client'

import { format, parseISO } from "date-fns";
import { useState, useEffect, ChangeEvent, useMemo, useRef } from "react";
import { Button } from "@nextui-org/button";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/dropdown";
import { Spinner } from "@nextui-org/spinner";
import { Checkbox } from "@nextui-org/checkbox";
import { Input } from "@nextui-org/input";
import { SearchProps } from "../utils/video-utils";
import Footer from "@/components/footer";

import { Video, fetchVideos, fetchVideoSearch } from "../utils/video-utils";
import Link from "next/link";
import { NextUIProvider, SharedSelection } from "@nextui-org/system";

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

  const limit = 40; // cards per page

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
      desc: !searchProps.desc
    });

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
    <NextUIProvider>
      <div className="h-screen w-screen overflow-auto">
        <div className="flex flex-col gap-3 items-center min-w-[271px]">
          <div className="grid grid-cols-3 gap-2 sticky top-0 z-40 bg-background p-5 opacity-90">
            <h2 className="col-span-3 text-lg text-center"><b>{strictMode ? "(strict) " : ""}Query: &quot;{searchTerm ? searchTerm : "all videos"}&quot; ({videos.length})</b></h2>
            <Button className="dark w-1/3" size="sm" isDisabled={page === 0} onPress={() => prevPage()}>Back</Button>
            <span className="inline-block text-sm content-center text-center">Page {page + 1}</span>
            <Button className="dark" size="sm" onPress={() => nextPage()}>Next</Button>
            <Input isClearable onClear={() => clearSearch()} onChange={searchVideos} size="sm" className="dark col-span-3 h-10" label="Search"></Input>
            <Dropdown>
              <DropdownTrigger>
                <Button
                  variant="flat"
                  size="sm"
                  className="capitalize dark col-span-2"
                >
                  {selectedValue}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                className="dark bg-background border-none"
                disallowEmptySelection
                selectionMode="single"
                selectedKeys={sortBySelection}
                onSelectionChange={updateSortBySelection}
              >
                {sortBy.map((val) => (
                  <DropdownItem className="dark" key={val}>{val}</DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Checkbox onValueChange={toggleSortingOrder} defaultSelected size="sm">Desc.</Checkbox>
            <Checkbox onValueChange={setStrictMode} size="sm">Strict</Checkbox>
            <Link href="/comments" className="col-span-3 text-center align-middle text-sm no-underline">Search comments</Link>
          </div>

          {
            loading ?
              <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                width: "100vw"
              }}>
                <Spinner />
              </div>
              :
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {videos.map((video, index) => (
                  <Card
                    className="dark min-w-[322px] opacity-0 animate-fade-in"
                    radius="sm"
                    key={video.id}
                    style={{ animationDelay: `${index * 25}ms` }} // Staggered fade-in effect
                  >
                    <CardHeader className="text-md"><h1 className="px-2 pt-2"><b>{video.title}</b></h1></CardHeader>
                    <CardBody>
                      <p className="px-4">
                        {video.summary}
                      </p>
                    </CardBody>
                    <hr></hr>
                    <CardFooter>
                      <div className="grid grid-cols-3 xl:grid-cols-3 gap-2 text-center text-sm w-full">
                        <p>Posted<br></br><b>{format(parseISO(video.createdAt), "yy/MM/dd HH:mm")}</b></p>
                        <p>Likes<br></br><b>{video.likeCount}</b></p>
                        <p>Anger<br></br><b>{video.angerCount}</b></p>
                        <p>Runtime<br></br><b>{video.duration ? Math.round(video.duration / 60) + 'min' : 'n/a'}</b></p>
                        <p>Comments<br></br><b>{video.commentCount ? <Link href={"/video?videoId=" + video.id}>{video.commentCount}</Link> : "0"}</b></p>
                        <p>Views<br></br><b>{video.playCount}</b></p>
                        <ul className="col-span-3">
                          <span><b>Links</b></span>
                          <li><a href={"https://banned.video/watch?id=" + video.id} target="_blank" rel="noopener noreferrer">banned.video</a></li>
                        </ul>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </ul>
          }
        </div>
        <Footer />
      </div>
    </NextUIProvider>
  );
}
