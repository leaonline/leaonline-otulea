#!/usr/bin/env bash

# -----------------------------------------------------------------------------
# Step 1: update meteor core and related packages
# -----------------------------------------------------------------------------

# pass all package dirs as parameters to the script call or put them in here
PACKAGE_DIRS="../lib:../liboauth:../libnpm"
METEOR_PACKAGE_DIRS=${PACKAGE_DIRS} meteor update --all-packages
