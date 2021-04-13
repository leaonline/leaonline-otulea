#!/bin/sh
meteor npm install

PACKAGE_DIRS="../lib:../liboauth"
AUTOFORM_DYNAMIC_IMPORTS=1 \
    AUTOFORM_DEBUG=1 \
    USE_DYNAMIC_IMPORTS=1 \
    METEOR_PACKAGE_DIRS=${PACKAGE_DIRS}  \
    meteor \
        --production \
        --extra-packages bundle-visualizer \
        --port=3000 \
        --settings=settings.json
