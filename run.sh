#!/bin/sh
meteor npm install

PACKAGE_DIRS="../lib:../liboauth"
METEOR_PACKAGE_DIRS=${PACKAGE_DIRS}  meteor --settings=settings.json
