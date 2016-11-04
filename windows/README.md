# Windows build

On a Windows machine:

- Install Inno Setup: http://www.jrsoftware.org/isdl.php
- Install Microsoft SDK: http://www.microsoft.com/en-gb/download/details.aspx?id=8279
- Checkout the project or use networked file sharing, for example from your OS X machine to the Windows machine: https://support.apple.com/kb/PH18707. [Just make sure the path doesn't have any spaces](https://github.com/nodejs/node/issues/5160).
- Also ensure that you have ran `gulp build` and that the `opt/Gitter/win32` directory exists and has `Gitter.exe` inside of it, see https://github.com/gitterHQ/desktop#releasing-the-app-win32-and-linux3264
- Run `node "\\ERIC-MACBOOK\eric\Documents\github\desktop\windows\build.js" -p thepfxcertpasswordhere`

You should end up with a `GitterSetup-x.x.x.exe` installer inside `./artefacts/`

## Code Sign

You'll need to sign the Gitter.exe binary and the installer separately.

### SignTool (method used in build.js)

Install Microsoft SDK from: http://www.microsoft.com/en-gb/download/details.aspx?id=8279

Usage: `signtool.exe sign /f troupe-cert.pfx binary.exe`

### kSign

Has a nw. Very easy to use. Just use the cert provided: `troupe-cert.pfx`

## Inno Setup

`gitter.iss` contains an Inno Setup manifest to generate an installer for Windows.

If you need to modify the Inno Setup file, you can use the Inno Script Studio (or a text editor if you know the config): https://www.kymoto.org/products/inno-script-studio

Get Inno Setup from: http://www.jrsoftware.org/isdl.php

Generate an installer with: `"C:\Program Files\Inno Setup 5\ISCC.exe" "C:\gitter-desktop\gitter.iss`
