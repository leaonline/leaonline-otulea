#!/usr/bin/env bash
mongorestore --host="127.0.0.1" --port="3001" \
    --archive=$1 --gzip --verbose \
    --nsInclude="leaonline-otulea.*" \
    --nsExclude='leaonline-otulea.meteor_accounts_loginServiceConfiguration' \
    --nsExclude='leaonline-otulea.meteor_oauth_pendingCredentials' \
    --nsFrom="leaonline-otulea.*" --nsTo="meteor.*" --convertLegacyIndexes
