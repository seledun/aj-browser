#!/bin/bash

SESSION_NAME="aj-browser-update"
LOG_FILE="logs/"$(date "+%y-%m-%d-%H-%M.txt")
PYTHON_SCRIPT="main.py"

tmux new-session -d -s $SESSION_NAME

tmux rename-window -t $SESSION_NAME:0 "Script"
tmux send-keys -t $SESSION_NAME:0 "python3 $PYTHON_SCRIPT" C-m

tmux new-window -t $SESSION_NAME:1 -n 'Logs'
tmux send-keys -t $SESSION_NAME:1 "watch -n 5 -c 'tail -n40 $LOG_FILE'" C-m

if [ "$1" == "a" ]; then
    # Attach to the tmux session if argument "a" is passed
    tmux attach -t $SESSION_NAME
else
    echo "Tmux session created. Run 'tmux attach -t $SESSION_NAME' to attach."
fi