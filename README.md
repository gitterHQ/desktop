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

License
-------

MIT
