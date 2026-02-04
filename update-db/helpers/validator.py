"""
Docstring for update-db.helpers.validator
"""
from datetime import datetime
from typing import List, Union, Optional
from pydantic import BaseModel, ConfigDict, Field

# Base model configuration


class GraphQLBaseModel(BaseModel):
    """
    Base model for GraphQL responses. 
    This model ignores any extra fields in the response and 
    only populates fields defined in the model.
    """
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

# General Error Response


class GraphQLErrorMsg(GraphQLBaseModel):
    """
    Error message model for GraphQL errors, containing only the message field.
    This model is used for all error messages returned by the GraphQL API.
    """
    message: str


class ErrorResponse(GraphQLBaseModel):
    """
    Model for GraphQL error responses, containing a list of error messages.
    """
    errors: List[GraphQLErrorMsg]

# Get Channel Videos Validation


class Video(BaseModel):
    """
    Docstring for Video
    """
    id: str = Field(alias="_id")
    title: str
    summary: str
    playCount: int
    likeCount: int
    angerCount: int
    videoDuration: float | None = None
    createdAt: datetime

    model_config = ConfigDict(extra="ignore")


class GetChannel(BaseModel):
    """
    Docstring for GetChannel
    """
    videos: List[Video]

    model_config = ConfigDict(extra="ignore")


class Data(BaseModel):
    """
    Docstring for Data
    """
    getChannel: GetChannel

    model_config = ConfigDict(extra="ignore")


class GetChannelVideosResponse(BaseModel):
    """
    Docstring for GetChannelVideosResponse
    """
    data: Data

    model_config = ConfigDict(extra="ignore")

# Get Video Comments Validation


class VoteCount(GraphQLBaseModel):
    """
    Docstring for VoteCount
    """
    positive: int


class User(GraphQLBaseModel):
    """
    Docstring for User
    """
    id: str = Field(alias="_id")
    username: str
    typename: str = Field(alias="__typename")


class Comment(GraphQLBaseModel):
    """
    Docstring for Comment
    """
    id: str = Field(alias="_id")
    content: str
    user: User
    voteCount: VoteCount
    linkedUser: Optional[User] = None
    createdAt: datetime
    replyCount: int


class GetVideoCommentsData(GraphQLBaseModel):
    """
    Docstring for GetVideoCommentsData
    """
    getVideoComments: List[Comment]


class GetVideoCommentsResponse(GraphQLBaseModel):
    """
    Docstring for GetVideoCommentsResponse
    """
    data: GetVideoCommentsData

# Get Comment Replies Validation


class ReplyTo(GraphQLBaseModel):
    """
    Docstring for ReplyTo
    """
    id: str = Field(alias="_id")


class Reply(GraphQLBaseModel):
    """
    Docstring for Reply
    """
    id: str = Field(alias="_id")
    content: str
    liked: bool
    user: User
    voteCount: VoteCount
    linkedUser: Optional[User] = None
    createdAt: datetime
    replyTo: ReplyTo


class GetCommentReplies(GraphQLBaseModel):
    """
    Docstring for GetCommentReplies
    """
    getCommentReplies: List[Reply]


class GetCommentRepliesResponse(GraphQLBaseModel):
    """
    Docstring for GetCommentRepliesResponse
    """
    data: GetCommentReplies


# Unions
GetChannelVideosUnion = Union[GetChannelVideosResponse, ErrorResponse]
GetVideoCommentsUnion = Union[GetVideoCommentsResponse, ErrorResponse]
GetCommentRepliesUnion = Union[GetCommentRepliesResponse, ErrorResponse]
