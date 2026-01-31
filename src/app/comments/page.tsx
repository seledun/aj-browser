'use client'

import { format, parseISO } from "date-fns";
import { useState, useEffect, ChangeEvent, useMemo, useRef } from "react";
import { Button } from "@heroui/button";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Spinner } from "@heroui/spinner";
import { Input } from "@heroui/input";
import { Checkbox } from "@heroui/checkbox";
import { Divider } from "@heroui/divider"
import { SearchProps } from "../../utils/video-utils";
import Footer from "@/components/footer";
import { Accordion, AccordionItem } from "@heroui/accordion";

import { Comment, searchAllComments, searchAllCommentsTerms } from "../../utils/comment-utils";
import Link from "next/link";
import { HeroUIProvider, SharedSelection } from "@heroui/react";

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
  const [sortDesc, setSortDesc] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);

  const [sortBySelection, setSortBySelection] = useState(new Set(["Sort by"]));

  const selectedValue = useMemo(
    () => Array.from(sortBySelection).join(", ").replaceAll("_", " "),
    [sortBySelection]
  );

  const [searchMode, setSearchMode] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const isFirstRender = useRef(true);

  const limit = 36;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const searchComments = async () => {
      if (searchTerm.length > 1) {
        setSearchMode(true);
        setPage(0);
        setLoading(true);

        const search = strictMode ? ' ' + searchTerm + ' ' : searchTerm;
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
    searchComments();
  }, [searchTerm, strictMode]);

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
      const comments = await searchAllCommentsTerms(search, (page + 1) * limit, limit, searchProps);
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
        const search = strictMode ? ' ' + searchTerm + ' ' : searchTerm;
        const videos = await searchAllCommentsTerms(search, (page - 1) * limit, limit, searchProps);
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
      const search = strictMode ? ' ' + searchTerm + ' ' : searchTerm;
      const comments = await searchAllCommentsTerms(search, page, limit, searchProps);
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
    <HeroUIProvider>
      <div className="h-screen">
        <div className="flex flex-col gap-3 items-center min-w-[271px]">
          <Accordion className=" sticky mt-2 top-0 z-40 max-w-md bg-black opacity-80" isCompact variant="bordered" defaultExpandedKeys={["1"]}>
            <AccordionItem key="1" title="Search options" className="">
              <div className="grid grid-cols-3 gap-2 bg-black rounded-b-2xl p-6 sticky top-0 z-40 bg-background">
                <h2 className="col-span-3 text-lg text-center"><b>{strictMode ? "(strict) " : ""}Query: &quot;{searchTerm ? searchTerm : "all comments"}&quot; ({comments.length})</b></h2>
                <Button className="" size="sm" isDisabled={page === 0} onPress={() => prevPage()}>Back</Button>
                <span className="inline-block text-sm content-center text-center">Page {page + 1}</span>
                <Button className="" size="sm" onPress={() => nextPage()}>Next</Button>
                <Input isClearable onClear={() => clearSearch()} onChange={searchVideos} size="sm" className=" col-span-3 h-10" label="Search"></Input>
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      variant="flat"
                      size="sm"
                      className="capitalize  col-span-2"
                    >
                      {selectedValue}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    className=" bg-background border-none"
                    disallowEmptySelection
                    selectionMode="single"
                    selectedKeys={sortBySelection}
                    onSelectionChange={updateSortBySelection}
                  >
                    {sortBy.map((val) => (
                      <DropdownItem className="" key={val}>{val}</DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
                <Checkbox onValueChange={toggleSortingOrder} defaultSelected size="sm">Desc.</Checkbox>
                <Checkbox onValueChange={setStrictMode} size="sm" className="justify-self-center">Strict</Checkbox>
                <Link href="/" className="col-span-3 text-center align-middle text-sm no-underline">Search videos</Link>
              </div>
            </AccordionItem>
          </Accordion>
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
                    radius="sm"
                    key={comment.id}
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
    </HeroUIProvider>
  );
}
