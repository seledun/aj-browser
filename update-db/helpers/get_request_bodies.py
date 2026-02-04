# pylint: disable=line-too-long

"""
Docstring for update-db.helpers.get_request_bodies
"""


def get_video_request_body(channel_id, limit, offset):
    """
    Docstring for getVideoRequestBody

    :param channel_id: Id of the channel that is queried
    :param limit: Limit for the response size
    :param offset: Offset for the query
    """
    return {
        "operationName": "GetChannelVideos",
        "variables": {"id": channel_id, "limit": limit, "offset": offset},
        "query": "query GetChannelVideos($id: String!, $limit: Float, $offset: Float) { getChannel(id: $id) { _id videos(limit: $limit, offset: $offset) { ...DisplayVideoFields __typename } __typename } } fragment DisplayVideoFields on Video { _id title summary playCount likeCount angerCount largeImage embedUrl published videoDuration channel { _id title avatar __typename } createdAt __typename }"
    }


def get_comment_request_body(video_id, limit, offset):
    """
    Docstring for getCommentRequestBody

    :param video_id: Id of the video that is queried
    :param limit: Limit for the response size
    :param offset: Offset for the query
    """
    return {
        "operationName": "GetVideoComments",
        "variables": {"id": video_id, "limit": limit, "offset": offset},
        "query": "query GetVideoComments($id: String!, $limit: Float, $offset: Float) { getVideoComments(id: $id, limit: $limit, offset: $offset) { ...VideoComment replyCount __typename } } fragment VideoComment on Comment { _id content liked user { _id username __typename } voteCount { positive __typename } linkedUser { _id username __typename } createdAt __typename }"
    }


def get_comment_replies_request_body(comment_id, limit, offset):
    """
    Docstring for getRepliesRequestBody

    :param comment_id: Id of the comment that is queried
    :param limit: Limit for the response size
    :param offset: Offset for the query
    """
    return {"operationName": "GetCommentReplies",
            "variables": {"id": comment_id, "limit": limit, "offset": offset},
            "query": "query GetCommentReplies($id: String!, $limit: Float, $offset: Float) {\n  getCommentReplies(id: $id, limit: $limit, offset: $offset) {\n    ...VideoComment\n    replyTo {\n      _id\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment VideoComment on Comment {\n  _id\n  content\n  liked\n  user {\n    _id\n    username\n    __typename\n  }\n  voteCount {\n    positive\n    __typename\n  }\n  linkedUser {\n    _id\n    username\n    __typename\n  }\n  createdAt\n  __typename\n}\n"}
