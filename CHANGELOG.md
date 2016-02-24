
# `3.0.1` - 2016-2-23

- Update docs to add more detail on how to build
- Upgrade to nw.js v0.12.3
   - Fixes issue where the org overview pages had an infinite loading spinner: https://github.com/gitterHQ/desktop/issues/102
   - Fixes `Cmd+M` shortcut to minimize: https://github.com/gitterHQ/desktop/issues/91
   - Fixes tray icon missing on Ubuntu: https://github.com/gitterHQ/desktop/issues/101
- Fix focus issue on initial load with mac. Mac apps do not have focus when they start up
- Update `notifier.js` so that it no longer plays the native sound, fixes https://github.com/gitterHQ/desktop/issues/99
- Add avatars to notifications for Windows
- I assume this covers as the official release of the nw.js version of the mac app: https://github.com/gitterHQ/desktop/issues/47
- Generalize windows desktop build, see `./windows/README.md` and `./windows/build.js`. `./windows/build.bat` has also gotten some love but is deprecated and is only there until we are confident and settled with the node script.
- Remove startup option from Windows installer because it did not obey whatever you set it to(always enabled launch at startup): https://github.com/gitterHQ/desktop/issues/106
- Add context menu option to toggle launch on startup (tested on Mac and Windows): https://github.com/gitterHQ/desktop/issues/45
- Add "Show in Menu bar" toggle (this option existed previously but didn't do anything)
- Add `gulp check-path-safety-for-windows` to build flow so you don't get [unexpected blank screen when developing on Windows](https://github.com/gitterHQ/desktop/issues/59)
- Update `auto-update` params/logic so we can actually use cli params outside of the autoupdate process.
   - `--update-url`: Specify custom URL to check and download updates from
   - `--passthrough-remote-debugging-url`: So you can debug the new instances we pop throughout the update process
- Update auto-update logic to check on start and every 24-hours after that
- Add `packages -> osx` `package.json` manifest check entry to play more nicely with our platform checks.

Here is the v3 PR: https://github.com/gitterHQ/desktop/pull/100

# `2.4.0` - 2015-09-04
fixes for the autoupdate process

# `2.3.3` - 2015-09-01
fix for windows startup sometimes showing node-webkit ascii art

# `2.3.2` - 2015-04-08
updated realtime client

# `2.3.1` - 2015-03-10
fix for hard websocket crash

# `2.3.0` - 2015-03-06
stabilty fixes and first open source release

# `2.2.5` - 2015-02-20
realtime connection stabilty fixes

# `2.2.4` - 2015-02-12
fixes issues with tray and badge disconnecting

# `2.2.3` - 2015-02-09
fix Ubuntu libudev symlinking

# `2.2.2` - 2015-02-04
oauth fixes

# `2.2.1` - 2015-02-04
oauth fixes

# `2.2.0` - 2015-02-04
fixed autoupdater trashing the uninstaller

# `2.1.3` - 2015-02-03
autoupdate caching fixes

# `2.1.2` - 2015-02-03
autoupdate tweaks

# `2.1.1` - 2015-02-03
file menu tweaks

# `2.1.0` - 2015-02-02
added auto update

# `2.0.4` - 2015-01-22
alpha release for windows

# `2.0.3` - 2015-01-22
internal windows release

# `2.0.2` - 2015-01-21
internal windows release

# `2.0.1` - 2015-01-21
internal windows release

# `2.0.0` - 2015-01-21
internal windows release
