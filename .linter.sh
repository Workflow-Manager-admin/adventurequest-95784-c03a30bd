#!/bin/bash
cd /home/kavia/workspace/code-generation/adventurequest-95784-c03a30bd/rpg_game_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

