Gitter Desktop Client
=====================

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/gitterHQ/desktop?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/gitterHQ/desktop.svg?branch=master)](https://travis-ci.org/gitterHQ/desktop)

This is the desktop client for Linux, Windows and Mac OSX.

Latest Builds
-------------

For the official downloads, please visit [https://gitter.im/apps](https://gitter.im/apps).

Running The Development Version
-------------------------------

The Gitter Desktop client is written using [NW.js](http://nwjs.io/), but the only prerequisite is [node.js](http://nodejs.org/download) for your platfrom.

1. clone this repo: `git clone git@github.com:gitterHQ/desktop.git && cd desktop`
2. install all dependencies: `npm install`
3. generate your own [app oAuth credentials](https://developer.gitter.im/apps) where the redirect url is `app://gitter/oauth.html`
4. start the app with your credentials:
  * linux/osx: `OAUTH_KEY=yourkey OAUTH_SECRET=yoursecret npm start`
  * windows cmd: `set OAUTH_KEY=yourkey && set OAUTH_SECRET=yoursecret && npm start`
  * alternatively, put your keys and secrets in `nwapp/oauth.json`

Tray Icon on Ubuntu
-------------------
To see the Gitter tray icon run:

```
sudo apt-add-repository ppa:gurqn/systray-trusty
sudo apt-get update
sudo apt-get upgrade
```

More info [here](http://ubuntuforums.org/showthread.php?t=2217458).

Enabling Logging on Windows
---------------------------
To enable logging on Windows, please [follow this guide](https://gist.github.com/trevorah/bfeb4ad69e4633dc76c5).

Releasing the app (win32 and linux32/64)
----------------------------------------
1. Build all app artefacts
  1. On osx/linux, run `gulp build:linux`
  2. On osx/linux, run `gulp cert:fetch:win`
  3. On windows, mount this project and run `windows/build.bat VERSION` (e.g `windows/build.bat 1.2.3`)
  4. On osx/linux, run `gulp autoupdate:zip:win`
  5. On osx/linux, create the redirect pages with `gulp redirect:source`
2. **Check that all the binaries work**. You should have:
  * GitterSetup-2.2.5.exe
  * gitter_2.2.5_amd64.deb
  * gitter_2.2.5_i386.deb
  * latest_linux32.html
  * latest_linux64.html
  * latest_win.html
  * win32.zip
3. Publish the release (all uploads will throw a formatError!)
  1. on osx/linux, publish the artefacts by running:
    * `gulp artefacts:push:win`
    * `gulp artefacts:push:linux32`
    * `gulp artefacts:push:linux64`
    * `gulp autoupdate:push:win`
  2. on osx/linux, publish the redirects by running:
    * `gulp redirect:push:win`
    * `gulp redirect:push:linux32`
    * `gulp redirect:push:linux64`
  3. on osx/linux, publish the autoupdate manifest by running `gulp manifest:push`

License
-------

MIT
