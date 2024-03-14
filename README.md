# otu.lea - diagnostics for lea.online

![lea.online logo, cc-? University of Bremen](https://blogs.uni-bremen.de/leaonline/files/2019/03/cropped-header-lea-online-01-3.png)

![Lint suite](https://github.com/leaonline/leaonline-otulea/workflows/Test%20suite/badge.svg)
[![built with Meteor](https://img.shields.io/badge/Meteor-1.11.1-green?logo=meteor&logoColor=white)](https://meteor.com)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Project Status: Active – The project has reached a stable, usable state and is being actively developed.](https://www.repostatus.org/badges/latest/active.svg)](https://www.repostatus.org/#active)
![GitHub](https://img.shields.io/github/license/leaonline/leaonline-otulea)
[![DOI](https://zenodo.org/badge/204466933.svg)](https://zenodo.org/doi/10.5281/zenodo.10813761)

Diagnostics app for lea.online, independent from the lea.app, desktop-focused
PWA.

otu.lea is a short term for "**O**nline **T**est**u**mgebung im Projekt **lea**"
, which is a German research and development project to assess and improve the
fundamental literacy of the German workforce.

## Installation and usage

This application is part of a multi-app environment. Please follow the
instructions in the [development-project](https://github.com/leaonline/dev) to run the app and the environment.

## Running the app, tests etc

In order to reduce configuration-complexity we have created a few scirpts, that
makes it much easier für you to run and test the app:

**`run.sh`**

Starts the app with respective parameters

**`prod.sh`**

Starts the app with production flag to test performance and bundling.

**`visualize.sh`**

Starts the app with production flag and `bundle-visualizer` to see bundle size.

**`update_packages.sh`**

Updates Meteor packages (and core if needed) plus NPM packages to their latest
stable versions.

**`commit_update.sh`**

Standard-commit the changes from **`update_packages.sh`**

**`test.sh`**  

Run without parameters to run tests in watch mode.

Run with `-c` to do a coverage test once.

Run with `-v` to add more verbose output to console

**`meteor.sh`**

Run meteor commands with `METEOR_PACKAGE_DIRS` included.

## Contribution

Contributions are very welcomed!

## License

This software is published under APGL-3.0, see [the LICENSE file](./LICENSE) for
further details.
