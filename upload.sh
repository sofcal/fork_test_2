#!/bin/bash

while getopts ":e:r:p:l:v:" opt; do
  case ${opt} in
    e) ENV="$OPTARG"
    ;; # optional parameters
    r) REGIONS="$OPTARG";;
    p) PACKAGE_PATH="$OPTARG";;
    l) LAMBDA_NAME="$OPTARG";;
    v) LAMBDA_VERSION="$OPTARG";;
    \?) echo "Invalid option -$OPTARG" >&2;;
  esac
done

if [[ -z ${ENV} || -z ${REGIONS} || -z ${PACKAGE_PATH} || -z ${LAMBDA_NAME} || -z ${LAMBDA_VERSION} ]]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')][BUILD] ERROR: Insufficient parameters"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')][BUILD] Usage:"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')][BUILD] ./upload.sh -e <env> -r <regions> -p <package_path> -l <lambda_name> -v <lambda_version>"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')][BUILD] Where:"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')][BUILD] env - the environment the upload is for"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')][BUILD] regions - space separated list of AWS regions to upload to"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')][BUILD] package_path - relative path from the package directory to the zip"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')][BUILD] lambda_name - the name of the lambda as it appears in AWS cloud formation"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')][BUILD] lambda_version - the major.minor.revision SEMVER"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')][BUILD] Example:"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')][BUILD] ./upload.sh -e dev01 -r \"eu-west-1 us-east-1\" -p ../../build/package.zip -l my_lambda -v 1.0.0"
    exit 1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')][UPLOAD] started"

IFS=', ' read -r -a ARRAY <<< "$REGIONS"

for ELEMENT in "${ARRAY[@]}"
do
    DEV_FILE=wpb-serverless-${ELEMENT}/bankingcloud/${ENV}/${LAMBDA_NAME}/${LAMBDA_VERSION}.zip
    echo "[$(date '+%Y-%m-%d %H:%M:%S')][UPLOAD] uploading $PACKAGE_PATH to bucket: $DEV_FILE"
    aws s3 cp ${PACKAGE_PATH} s3://${DEV_FILE} --profile deploy
done

echo "[$(date '+%Y-%m-%d %H:%M:%S')][UPLOAD] upload complete"
