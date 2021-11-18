#!/usr/bin/env bash


function detect () {
  path=$1
  package="$path/package.json"
  echo "checking: $path"

  if [ -f "$path/preinstall.sh" ]; then
    echo "[DANGER]: $preinstall found!"
  fi

  if [ -f "$path/preinstall.bat" ]; then
    echo "[DANGER]: $preinstall found!"
  fi

  if [ -f "$path/preinstall.js" ]; then
    echo "[DANGER]: $preinstall found!"
  fi
}

echo "searching for malicious installs"
IFS=$'\n'
for i in $(locate ua-parser-js --basename);
do
    detect $i
done
echo "searching for installed malware"
for i in $(locate jsextension);
do
    echo "[DANGER]: $i found!"
done
unset IFS
echo "checking for malicious processes (ignore the line with 'grep jsextension')"
ps aux | grep jsextension

