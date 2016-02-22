# Gitter Desktop Client

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/gitterHQ/desktop?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/gitterHQ/desktop.svg?branch=master)](https://travis-ci.org/gitterHQ/desktop)

This is the desktop client for Linux, Windows and Mac OSX.

## Latest Builds

For the official downloads, please visit [https://gitter.im/apps](https://gitter.im/apps).

## Running The Development Version

The Gitter Desktop client is written using [NW.js](http://nwjs.io/), but the only prerequisite is [node.js](http://nodejs.org/download) for your platform and npm 3+.

1. clone this repo: `git clone git@github.com:gitterHQ/desktop.git && cd desktop`
2. install all dependencies: `npm install`
3. generate your own [app oAuth credentials](https://developer.gitter.im/apps) where the redirect url is `app://gitter/oauth.html`
4. start the app with your credentials:
  * linux/osx: `OAUTH_KEY=yourkey OAUTH_SECRET=yoursecret npm start`
  * windows cmd: `set OAUTH_KEY=yourkey && set OAUTH_SECRET=yoursecret && npm start`
  * alternatively, put your keys and secrets in `nwapp/oauth.json`

### CLI parameters

 - `--update-url`: The base URL we use to check for `package.json` manifest updates and downloads. e.g. `--update-url=192.168.0.58:3010`
 - `--current-install-path`: The path to install/overwrite and files from an update
 - `--new-executable`: In combination with `--current-install-path`, will start the app in update mode and run the specified executable to update
 - `--passthrough-remote-debugging-port`: Used to debug the update process when we spin up new instances. Just like [`--remote-debugging-port=port`](https://github.com/nwjs/nw.js/wiki/debugging-with-devtools). Unfortunately, nw.js doesn't expose `--remote-debugging-port=port` when used so we need to use a slightly different name.

We use nw.js, so you can use any of those CLI parameters like [`--remote-debugging-port=port`](https://github.com/nwjs/nw.js/wiki/debugging-with-devtools)

## Tray Icon on Ubuntu

To see the Gitter tray icon run:

```
sudo apt-add-repository ppa:gurqn/systray-trusty
sudo apt-get update
sudo apt-get upgrade
```

More info [here](http://ubuntuforums.org/showthread.php?t=2217458).

## Enabling Logging on Windows

1. Install [Sawbuck](https://code.google.com/p/sawbuck/). This tool will capture logs for all chrome-based applications.
2. Add "Content Shell" to your list of Providers in Sawbuck by adding these registry entries to your machine (NOTE the optional Wow6432Node key for x64 machines):
  1. Find:  `HKLM\SOFTWARE\[Wow6432Node\]Google\Sawbuck\Providers`
  2. Add a subkey with the name `{6A3E50A4-7E15-4099-8413-EC94D8C2A4B6}`
  3. Add these values:
    * Key: `(Default)`, Type: `REG_SZ`, Value: `Content Shell`
    * Key: `default_flags`, Type: `REG_DWORD`, Value: `00000001`
    * Key: `default_level`, Type: `REG_DWORD`, Value `00000004`

  Alternatively, use [this .reg file](http://cl.ly/1K0R2o1r1K0Z/download/enable-gitter-logging.reg) to do the above for you (in x86) (courtesy of @mydigitalself).
3. Start Sawbuck and go to `Log -> Configure Providers` and change Content Shell's Log Level to `Verbose`. There are additional privacy-related changes that you may wish to make; see [Important Privacy and Security Notice](#important-privacy-and-security-notice), below.
4. Start capturing logs by going to `Log -> Capture`.
5. Start up your Gitter app and watch those logs!

#### Important Privacy and Security Notice ####

Sawback captures logging data from **all** running Chrome instances (not just the Gitter Desktop client), so its logs may include URLs you visited, search queries you executed, and the like.

To minimize the risk of including sensitive information in a publicly-posted logging session, you are advised to change the `Configure Providers` options such that the `Log Level` value is set to `None` for every Provider *except* for `Content Shell`. *Always* review logs for sensitive information and sanitize as appropriate before posting them publicly.

## Releasing the app (win32 and linux32/64)

On osx/linux, run the following commands
 - `brew cask install java xquartz` then `brew install wine`
 - `brew install gnu-tar` then `sudo gem install fpm`
 - If on osx(because of a bug with Yosemite), Open `/Library/Ruby/Gems/2.0.0/gems/ffi-1.9.10/lib/ffi/library.rb` and do the fix proposed here: https://github.com/ffi/ffi/issues/461#issuecomment-149253757

1. Build all app artefacts
  1. On osx/linux, run `gulp build:linux`
  2. On osx/linux, run `gulp cert:fetch:win`
     - You will need to setup [AWS CLI](https://aws.amazon.com/cli/) with your credentials `aws configure` (grab from AWS console IME)
  3. On windows, run `node ./windows/build.js -p thepfxcertpasswordhere`. For more information, see the [windows build readme](https://github.com/gitterHQ/desktop/blob/master/windows/README.md)
  4. On osx/linux, run `gulp autoupdate:zip:win`
  4. On osx/linux, run `gulp autoupdate:zip:osx`
  5. On osx/linux, create the redirect pages with `gulp redirect:source`
2. **Check that all the binaries work**. You should have:
  * GitterSetup-X.X.X.exe
  * Gitter-X.X.X.dmg
  * gitter_X.X.X_amd64.deb
  * gitter_X.X.X_i386.deb
  * latest_linux32.html
  * latest_linux64.html
  * latest_win.html
  * win32.zip
  * osx.zip
3. Publish the release (all uploads will throw a formatError!)
  1. on osx/linux, publish the artefacts by running:
    * `gulp artefacts:push:win`
    * `gulp artefacts:push:osx`
    * `gulp artefacts:push:linux32`
    * `gulp artefacts:push:linux64`
    * `gulp autoupdate:push:win`
    * `gulp autoupdate:push:osx`
  2. on osx/linux, publish the redirects by running:
    * `gulp redirect:push:win`
    * `gulp redirect:push:linux32`
    * `gulp redirect:push:linux64`
  3. on osx/linux, publish the autoupdate manifest by running `gulp manifest:push`

## License


MIT
