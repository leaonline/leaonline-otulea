#!/usr/bin/env bash

set -e

# This is the complete test suite kit, that allows to run multiple test
# scenarios during development of our app.
#
# We try to abstract most commends into a few options and defined the following
# behavior:

# defaults:

T_BROWSER="puppeteer"   # uses headless browser for client tests
T_COVERAGE=0            # has coverage disabled
T_FILTER=""             # runs all defined tests
T_FILTER_EXPLICIT=0      # an explicit grep intentionally runs a subset
T_RUN_ONCE=""           # runs in watch mode
T_VERBOSE=0             # no extra verbosity
T_SERVER=1              # runs server tests
T_CLIENT=1              # runs client tests
T_FULL_APP=0            # runs the normal app plus app-tests

# options:

SCRIPT_USAGE="
Usage: $(basename $0) [OPTIONS]

Options:
  -a <String>     Filter architecture, allowed values: 'server' or 'client'
  -b              Use a real browser for client tests (default is headless)
  -c              Activate code-coverage reports
  -f              Run in full-app mode (for *.app-tests.js integration tests)
  -g <RegExp>     Filter tests by a given RegExp (uses Mocha-grep)
  -h              Show help
  -o              Runs the tests only once (default is watch-mode)
  -v              Verbose mode with extra prints
"


while getopts "a:bcfg:hov" opt; do
  case $opt in
    a)
      if [ "$OPTARG" = "client" ]
      then
        T_CLIENT=1
        T_SERVER=0
      elif [ "$OPTARG" = "server" ]
      then
        T_CLIENT=0
        T_SERVER=1
      else
        echo "Invalid parameter value for -a: $OPTARG"
        echo "$SCRIPT_USAGE"
        exit 1
      fi
      ;;
    b)
      T_BROWSER=""
      ;;
    g)
      T_FILTER=${OPTARG}
      T_FILTER_EXPLICIT=1
      ;;
    v)
	  T_VERBOSE=1
      ;;
    c)
      T_COVERAGE=1
      ;;
    f)
      T_FULL_APP=1
      ;;
    o)
      T_RUN_ONCE="--once"
      ;;
    h)
      echo "$SCRIPT_USAGE"
      exit 1
      ;;
    \?)
      echo "$SCRIPT_USAGE"
      exit 1
      ;;
  esac
done

# build paths:

PROJECT_PATH=$(pwd)
T_PACKAGE_DIRS="../lib:../libnpm:../liboauth:../libext:../meteor-collection2/package:./github:./github/meteor-collection2/package"

PORT=3099

if [ "$T_VERBOSE" -eq "1" ];
then
	echo "=> Test leaonline-otulea"
	echo "=> Project path: [${PROJECT_PATH}]"
	echo "=> Port: [${PORT}]"
	echo "=> Lib path(s): [${T_PACKAGE_DIRS}]"
	echo "=> Run once? [${T_RUN_ONCE}]"
	echo "=> grep pattern: [${T_FILTER}]"
	echo "=> coverage: [${T_COVERAGE}]"
	echo "=> Browser: [${T_BROWSER}]"
	echo "=> Arch: [server: ${T_SERVER}, client: ${T_CLIENT}]"
	echo "=> Full app? [${T_FULL_APP}]"
fi

# Coverage reports must never retain files generated for an older source tree.
# Keep this deletion deliberately pinned to the project's report directory.
COVERAGE_DIR="${PROJECT_PATH}/.coverage"
if [ "$T_COVERAGE" -eq "1" ]; then
  if [ "$COVERAGE_DIR" != "${PROJECT_PATH}/.coverage" ]; then
    echo "Refusing to clean unexpected coverage directory: ${COVERAGE_DIR}"
    exit 1
  fi
  rm -rf -- "$COVERAGE_DIR"
  mkdir -p "$COVERAGE_DIR"
fi

T_BABEL_ENV="development"
if [ "$T_COVERAGE" -eq "1" ]; then
  T_BABEL_ENV="COVERAGE"
fi

T_FULL_APP_ARG=""
if [ "$T_FULL_APP" -eq "1" ]; then
  T_FULL_APP_ARG="--full-app"
  # Full-app mode also evaluates the configured unit-test module. Restrict the
  # default run to dedicated app-test suites, whose names carry this marker.
  if [ -z "$T_FILTER" ]; then
    T_FILTER="full-app"
  fi
fi

# create command:

run_tests() {
  METEOR_PACKAGE_DIRS=${T_PACKAGE_DIRS}  \
      TEST_BROWSER_DRIVER=${T_BROWSER} \
      TEST_SERVER=${T_SERVER} \
      TEST_CLIENT=${T_CLIENT} \
      MOCHA_GREP=${T_FILTER} \
      BABEL_ENV=${T_BABEL_ENV} \
      COVERAGE=${T_COVERAGE} \
      COVERAGE_OUT_HTML=${T_COVERAGE} \
      COVERAGE_OUT_LCOVONLY=${T_COVERAGE} \
      COVERAGE_APP_FOLDER=$PWD/ \
      COVERAGE_VERBOSE_MODE=${T_VERBOSE} \
      meteor test \
          ${T_FULL_APP_ARG} \
          ${T_RUN_ONCE} \
          --driver-package=meteortesting:mocha \
          --settings=settings.tests.json \
          --port=${PORT}
}

if [ -z "$T_RUN_ONCE" ]; then
  run_tests
  exit $?
fi

TEST_OUTPUT=$(mktemp -t otulea-tests.XXXXXX.log)
trap 'rm -f -- "$TEST_OUTPUT"' EXIT

set +e
run_tests 2>&1 | tee "$TEST_OUTPUT"
TEST_STATUS=${PIPESTATUS[0]}
set -e

if [ "$TEST_STATUS" -ne "0" ]; then
  exit "$TEST_STATUS"
fi

node scripts/check-test-output.mjs \
  "$TEST_OUTPUT" \
  "$T_SERVER" \
  "$T_CLIENT" \
  "$T_FULL_APP" \
  "$T_FILTER_EXPLICIT"

if [ "$T_COVERAGE" -eq "1" ]; then
  node scripts/check-coverage.mjs
fi
