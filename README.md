# Perceptual Compare

This repo works by running a local http server, taking a screenshot and do a compare with the previous
build.

### Install

- `yarn install`

### Run

A new build will be created in the builds folder with screenshots and differences created.

- `./node_modules/http-server/bin/http-server -o -p 8090`
- `node index`