#!/bin/bash

while getopts ":t:p:" opt; do
  case $opt in
    t) TYPE="$OPTARG";;
    p) PACKAGE_NAME="$OPTARG";;
    # optional parameters
    \?) echo "Invalid option -$OPTARG" >&2;;
  esac
done

if [[ $TYPE == "internal" ]]; then
    PACKAGE_NAME="internal-$PACKAGE_NAME"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')][TEMPLATE] generating $TYPE package for $PACKAGE_NAME"

FOLDER_NAME="${PACKAGE_NAME//-/.}"
cp -R "$PWD/templates/$TYPE/" "$PWD/packages/$FOLDER_NAME"

find "$PWD/packages/$FOLDER_NAME" -type f -name '*.*' -exec sed -i.bck -e "s/__package_name__/$PACKAGE_NAME/g" {} +;
find "$PWD/packages/$FOLDER_NAME" -type f -name '*.bck' -exec rm {} \;

find "$PWD/packages/$FOLDER_NAME" -type f -name '*.*' -exec sed -i.bck -e "s/__folder_name__/$FOLDER_NAME/g" {} +;
find "$PWD/packages/$FOLDER_NAME" -type f -name '*.bck' -exec rm {} \;