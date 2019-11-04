#!/bin/bash

# npm install -g npm@6.7.0 && sleep 5 && npm install -g lerna@3.16.4 && sleep 5 && npm install -g serverless@1.30.3 && sleep 5 && npm install -g rimraf@3.0.0

while getopts ":n:l:s:r:" opt; do
  case ${opt} in
    n) VERSION_NPM="$OPTARG"
    ;;
    l) VERSION_LERNA="$OPTARG"
    ;;
    s) VERSION_SERVERLESS="$OPTARG"
    ;;
    r) VERSION_RIMRAF="$OPTARG"
    ;;
    \?) echo "Invalid option -$OPTARG" >&2
    ;;
  esac
done

ACTUAL_NPM=$(npm -v)
echo "npm - expected: ${VERSION_NPM}; actual: ${ACTUAL_NPM}"
if [[ ${ACTUAL_NPM} != ${VERSION_NPM} ]]; then
    echo "installing npm";
    npm install -g npm@${VERSION_NPM}
fi;

ACTUAL_LERNA=$(lerna -v)
echo "lerna - expected: ${VERSION_LERNA}; actual: ${ACTUAL_LERNA}"
if [[ ${ACTUAL_LERNA} != ${VERSION_LERNA} ]]; then
    echo "installing lerna";
    npm install -g lerna@${VERSION_LERNA}
fi;

ACTUAL_SERVERLESS=$(serverless -v)
echo "serverless - expected: ${VERSION_SERVERLESS}; actual: ${ACTUAL_SERVERLESS}"
if [[ ${ACTUAL_SERVERLESS} != ${VERSION_SERVERLESS} ]]; then
    echo "installing serverless";
    npm install -g serverless@${VERSION_SERVERLESS}
fi;

# no version info for rimraf, but it's small anyway
echo "installing rimraf";
npm install -g rimraf@${VERSION_RIMRAF}