#!/bin/sh
meteor npm install

PRODUCTION_MODE=""
PROFILE_REQUIRE=""

while getopts "pr" opt; do
  case $opt in
    p)
	  PRODUCTION_MODE="--production"
      ;;
    r)
	  PROFILE_REQUIRE="--extra-packages zodern:profile-require"
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
  esac
done

PACKAGE_DIRS="../lib:../liboauth:../libext:../meteor-collection2/package"
DEBUG="app" METEOR_PACKAGE_DIRS=${PACKAGE_DIRS}  meteor \
    --exclude-archs=web.cordova \
    --settings=settings.json \
    ${PRODUCTION_MODE} \
    ${PROFILE_REQUIRE} \
