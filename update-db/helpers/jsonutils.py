def json_response_is_error(msg):
    """Checks if JSON response is an error message

        :param msg: loaded JSON object
    """
    return isinstance(msg, dict) and 'errors' in msg

def json_response_is_ok(msg):
    """Checks if JSON response is an ok response

        Doesn't check if the response contains comments, only checks
        if the response doesn't contain errors.

        :param msg: loaded JSON object
    """
    return (
        isinstance(msg, dict)
        and isinstance(msg.get('data'), dict)
    )

def json_response_is_finished(msg, field):
    """Checks if JSON response is a finished message

        Finished message entails that there are not comments to process,
        but is not an error message.

        :param msg: loaded JSON object
    """
    if not json_response_is_ok(msg):
        return False

    items = msg['data'].get(field)
    return isinstance(items, list) and len(items) == 0
