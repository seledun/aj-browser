def json_response_is_error(msg):
    """Checks if JSON response is an error message

        :param msg: loaded JSON object
    """
    if 'errors' in msg:
        return True;    
    return False

def json_response_is_ok(msg):
    """Checks if JSON response is an ok response

        Doesn't check if the response contains comments, only checks
        if the response doesn't contain errors.

        :param msg: loaded JSON object
    """
    if 'data' in msg and msg['data'] != None:
        return True
    return False

def json_response_is_finished(msg):
    """Checks if JSON response is a finished message

        Finished message entails that there are not comments to process,
        but is not an error message.

        :param msg: loaded JSON object
    """
    if 'data' in msg and msg['data'] != None:
        if len(msg['data']['getVideoComments']) == 0: # If the response is valid, and have 0 comments.
            return True
    return False