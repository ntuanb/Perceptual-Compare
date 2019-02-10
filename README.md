# Perceptual Compare

This repo works by running a local http server, taking a screenshot and do a compare with the previous
build.

### Install

- `yarn install`

### Run

- `./node_modules/http-server/bin/http-server -o -p 8090`
- `node index`

A new build will be created in the builds folder with screenshots and differences created.

### CI

View the following link [https://travis-ci.org/ntuanb/perceptual-compare](https://travis-ci.org/ntuanb/perceptual-compare) to see the build processing.