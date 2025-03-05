'use client'

import { format, parseISO } from "date-fns";
import { useState, useEffect, ChangeEvent, useMemo } from "react";
import { Button } from "@nextui-org/button";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/dropdown";
import { Spinner } from "@nextui-org/spinner";
import { Input } from "@nextui-org/input";
import { Checkbox } from "@nextui-org/checkbox";
import { Divider } from "@nextui-org/divider"
import { SearchProps } from "../../utils/video-utils";
import Footer from "@/components/footer";

import { Comment, searchAllComments, searchAllCommentsTerms } from "../../utils/comment-utils";
import Link from "next/link";
import { NextUIProvider, SharedSelection } from "@nextui-org/system";

const sortBy = [
  'Date',
  'Likes',
  'Replies'
]

export default function Home() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchProps, setSearchProps] = useState<SearchProps>({ orderBy: "Date", desc: true });
  const [strictMode, setStrictMode] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);

  const [sortBySelection, setSortBySelection] = useState(new Set(["Sort by"]));

  const selectedValue = useMemo(
    () => Array.from(sortBySelection).join(", ").replaceAll("_", " "),
    [sortBySelection]
  );

  const [searchMode, setSearchMode] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const limit = 40; // cards per page

  useEffect(() => {
    const loadComments = async () => {
      try {
        const fetchedVideos = await searchAllComments(page, limit, searchProps);
        if (fetchedVideos !== undefined) {
          setComments(fetchedVideos);
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    loadComments();
  }, []);

  const nextPage = async () => {
    setLoading(true);
    if (searchMode) {
      const comments = await searchAllCommentsTerms(searchTerm, (page + 1) * limit, limit, searchProps);
      if (comments !== undefined && comments.length > 0) {
        setPage(page + 1);
        setComments(comments);
      }

    } else {
      const videos = await searchAllComments((page + 1) * limit, limit, searchProps);
      if (videos !== undefined) {
        setPage(page + 1);
        setComments(videos);
      }
    }

    setLoading(false);
  }

  const prevPage = async () => {
    if (page > 0) {
      setLoading(true);
      if (searchMode) {
        const videos = await searchAllCommentsTerms(searchTerm, (page - 1) * limit, limit, searchProps);
        if (videos !== undefined && videos.length > 0) {
          setPage(page - 1);
          setComments(videos);
        }

      } else {
        const videos = await searchAllComments((page - 1) * limit, limit, searchProps);
        if (videos !== undefined) {
          setPage(page - 1);
          setComments(videos);
        }
      }

      setLoading(false);
    }
  }

  const currentPage = async () => {
    setLoading(true);
    if (searchMode) {
      const comments = await searchAllCommentsTerms(searchTerm, page, limit, searchProps);
      if (comments !== undefined && comments.length > 0) {
        setComments(comments);
      }
    } else {
      const videos = await searchAllComments(page, limit, searchProps);
      if (videos !== undefined && videos.length > 0) {
        setComments(videos);
      }
    }
    setLoading(false);
  }

  const searchVideos = async (ev: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(ev.target.value); // async
    if (searchTerm.length > 1) {
      setSearchMode(true);
      setPage(0);
      setLoading(true);

      const search = strictMode ? ' ' + ev.target.value + ' ' : ev.target.value;
      const comments = await searchAllCommentsTerms(search, page, limit, searchProps);
      
      if (comments !== undefined && comments.length > 0) {
        setComments(comments);
      }

      else if (strictMode) {
        setComments([]);
        setPage(0);
        setLoading(false);
      }

      setLoading(false);
    } else {
      setSearchMode(false);
      currentPage();
    }
  }

  const updateSortBySelection = (ev: SharedSelection) => {
    if (typeof ev.currentKey === 'string') {
      setSortBySelection(new Set([ev.currentKey]));
      setSearchProps({ orderBy: ev.currentKey, desc: searchProps.desc });
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
          <div className="grid grid-cols-3 gap-2 p-5 sticky top-0 z-40 bg-background opacity-90">
           <h2 className="col-span-3 text-lg text-center"><b>Results for: &quot;{searchTerm ? searchTerm : "all comments"}&quot; ({comments.length})</b></h2>
            <Button className="dark" size="sm" isDisabled={page === 0} onPress={() => prevPage()}>Back</Button>
            <span className="text-sm align-middle text-center">Page {page + 1}</span>
            <Button className="dark" size="sm" onPress={() => nextPage()}>Next</Button>
            <Input isClearable onClear={() => clearSearch()} onChange={searchVideos} size="sm" className="dark col-span-3 h-10" label="Search"></Input>
            <Dropdown>
              <DropdownTrigger>
                <Button
                  variant="flat"
                  size="sm"
                  className="capitalize dark col-span-3"
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
            <Checkbox onValueChange={setStrictMode} className="col-start-2">Strict search</Checkbox>
            <Link href="/" className="col-span-3 text-center align-middle text-sm">Search videos</Link>
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
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {comments.map((comment, index) => (
                  <Card
                    className="dark min-w-[322px] opacity-0 animate-fade-in"
                    radius="sm"
                    key={comment.id}
                    style={{ animationDelay: `${index * 25}ms` }} // Staggered fade-in effect
                  >
                    <CardHeader>
                      <Link className="no-underline font-bold" href={"/video?videoId=" + comment.videoId}><span className="text-medium">{comment.video?.title}</span></Link>
                    </CardHeader>
                    <Divider className="my-2" />
                    <CardBody>
                      <span className="px-2 pb-1 text-medium">
                        <Link className="no-underline font-bold" href={"/user?userId=" + comment.userId}>{comment.username}</Link>
                      </span>
                      <p className="px-4">
                        {comment.content}
                      </p>
                    </CardBody>
                    <hr></hr>
                    <CardFooter>
                      <div className="grid grid-cols-3 xl:grid-cols-3 gap-2 text-center text-sm w-full">
                        <p>Posted<br></br><b>{format(parseISO(comment.createdAt), "yy/MM/dd HH:mm")}</b></p>
                        <p>Likes<br></br><b>{comment.posVotes}</b></p>
                        <p>Replies<br></br><b>{comment.replyCount}</b></p>
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
