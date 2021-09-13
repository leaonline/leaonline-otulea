#!/bin/sh

PACKAGE_DIRS="../lib:../liboauth"
    USE_DYNAMIC_IMPORTS=1 \
    METEOR_PACKAGE_DIRS=${PACKAGE_DIRS}  \
    meteor \
        --production \
        --port=3000 \
        --settings=settings.json
