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
import Footer from "@/components/Footer";
import { Accordion, AccordionItem } from "@heroui/accordion";

import { Comment, searchAllComments, searchAllCommentsTerms } from "../../utils/comment-utils";
import { Link, Tooltip } from "@heroui/react";
import { SharedSelection } from "@heroui/react";
import CommentReplyDrawer from "@/components/CommentReplyDrawer";

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

  const [replyDrawerOpen, setReplyDrawerOpen] = useState<boolean>(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);

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
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-col gap-8 items-center w-full px-4 py-4">

        {/* Refactored Accordion: Unified with Video Search Page */}
        <Accordion
          className="sticky top-2 z-40 w-full max-w-2xl mx-auto"
          variant="shadow"
          isCompact
        >
          <AccordionItem
            key="1"
            title={
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-default-600">Comment Search</span>
                {!loading && (
                  <span className="text-tiny bg-default-100 px-2 py-0.5 rounded-full text-default-600">
                    {searchTerm ? `"${searchTerm}"` : "All comments"} ({comments.length})
                  </span>
                )}
              </div>
            }
          >
            <div className="flex flex-col gap-6 p-4 pt-0">
              {/* Main Search Bar */}
              <Input
                isClearable
                fullWidth
                onClear={() => clearSearch()}
                onChange={searchVideos}
                placeholder="Search comments across all videos..."
                size="md"
                variant="flat"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sorting & Order */}
                <div className="flex gap-2 items-center">
                  <Dropdown>
                    <DropdownTrigger>
                      <Button variant="flat" size="sm" className="w-full justify-between capitalize">
                        {selectedValue}
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
                  <Checkbox onValueChange={toggleSortingOrder} defaultSelected size="sm">Desc</Checkbox>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button isIconOnly size="sm" variant="flat" isDisabled={page === 0} onPress={() => prevPage()}>‹</Button>
                    <span className="text-tiny font-semibold px-2 min-w-15 text-center">Page {page + 1}</span>
                    <Button isIconOnly size="sm" variant="flat" onPress={() => nextPage()}>›</Button>
                  </div>
                  <Checkbox onValueChange={setStrictMode} size="sm" isSelected={strictMode}>Strict</Checkbox>
                </div>
              </div>

              <Divider />
              <div className="flex justify-center">
                <Link href="/" size="sm" showAnchorIcon className="text-default-500 font-medium">
                  Switch to Video Search
                </Link>
              </div>
            </div>
          </AccordionItem>
        </Accordion>

        {/* Responsive Comments Grid */}
        <main className="w-full max-w-7xl mx-auto">
          {selectedComment && (
            <CommentReplyDrawer
              isOpen={replyDrawerOpen}
              onClose={() => setReplyDrawerOpen(false)}
              parent={selectedComment}
            />
          )}
          {loading ? (
            <div className="flex justify-center items-center h-[50vh]">
              <Spinner size="lg" color="primary" label="Searching comments..." />
            </div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 list-none">
              {comments.map((comment, index) => (
                <li key={comment.id || index}>
                  <Card shadow="sm" radius="lg" isHoverable className="h-full border-none">
                    <CardHeader className="flex flex-col items-start px-4 pt-4">
                      <Tooltip
                        content={comment.video?.title}
                        delay={500}
                        portalContainer={typeof window !== "undefined" ? document.body : undefined}
                      >
                        <div className="w-full pointer-events-auto">
                          <Link
                            className="text-s font-bold text-primary line-clamp-3 hover:underline no-underline!"
                            href={`/video?videoId=${comment.videoId}`}
                          >
                            {comment.video?.title}
                          </Link>
                        </div>
                      </Tooltip>
                    </CardHeader>

                    <CardBody className="py-2">
                      <p className="text-default-600 text-sm">
                        <Link
                          className="text-sm font-semibold text-default-700 hover:text-primary pr-1 no-underline!"
                          href={`/user?userId=${comment.userId}`}
                        >
                          @{comment.username}:
                        </Link>
                        {comment.content}
                      </p>
                    </CardBody>

                    <Divider />

                    <CardFooter className="bg-default-50/30">
                      {/* Added items-center to the grid */}
                      <div className="grid grid-cols-3 gap-2 text-center w-full items-center">

                        {/* Column 1: Posted */}
                        <div className="flex flex-col items-center justify-center">
                          <p className="text-[10px] uppercase text-default-400 font-bold leading-none mb-1">Posted</p>
                          <p className="text-tiny font-semibold text-default-600">
                            {format(parseISO(comment.createdAt), "yy/MM/dd")}
                          </p>
                        </div>

                        {/* Column 2: Likes */}
                        <div className="flex flex-col items-center justify-center border-x border-default-200/50">
                          <p className="text-[10px] uppercase text-default-400 font-bold leading-none mb-1">Likes</p>
                          <p className="text-tiny font-mono font-bold text-success-700">{comment.posVotes}</p>
                        </div>

                        {/* Column 3: Replies */}
                        <div className="flex flex-col items-center justify-center">
                          <p className="text-[10px] uppercase text-default-400 font-bold leading-none mb-1">Replies</p>
                          <button
                            className={`text-sm font-mono leading-none ${comment.replyCount > 0
                                ? "text-primary hover:underline cursor-pointer"
                                : "text-default-400 cursor-default"
                              }`}
                            onClick={() => {
                              if (comment.replyCount > 0) {
                                setSelectedComment(comment);
                                setReplyDrawerOpen(true);
                              }
                            }}
                          >
                            {comment.replyCount}
                          </button>
                        </div>

                      </div>
                    </CardFooter>
                  </Card>
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
