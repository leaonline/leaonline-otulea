#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Step 2: update all outdated npm packages to the latest
# thanks to: https://stackoverflow.com/a/55406675/3098783
# -----------------------------------------------------------------------------

meteor npm install $(meteor npm outdated | cut -d' ' -f 1 | sed '1d' | xargs -I '$' echo '$@latest' | xargs echo)

# -----------------------------------------------------------------------------
# Step 3: clean installed modules because some modules are broken
# after an update (mostly related to modules that needs to be built)
# -----------------------------------------------------------------------------

rm -rf ./node_modules
meteor npm install
