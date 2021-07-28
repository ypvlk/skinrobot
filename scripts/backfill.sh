#!/bin/bash

# chmod +x the_file_name //permissions for .sh files

RED="\033[0;31m"
BLUE="\033[0;34m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
NC="\033[0m" # No Color

echo -e "${BLUE}Backfill script running...${NC}"
printf "\n"

echo -e "Delete previous ${YELLOW}backfill.data${NC} file..."
    rm -rf ./scripts/backfill.data
printf "\n"

echo -e "Run ${YELLOW}backfill.js${NC} file..."
    node ./scripts/backfill.js
printf "\n"
echo -e "Created new ${YELLOW}backfill.data${NC} file with commands array"

echo -e "Read ${YELLOW}backfill.data${NC} file..."
IFS=$'\n'; command eval  'PAIRS=($(cat ./scripts/backfill.data))'

for PAIR in ${PAIRS[@]}; do
    echo -e "${BLUE}Start${NC} getting data from ${YELLOW}${PAIR}${NC}"
    command eval node main.js backfill ${PAIR}
    echo -e "${BLUE}Finish${NC} getting data from ${YELLOW}${PAIR}${NC}"
    printf "/n"
done