# Windows build

On a Windows machine:

- Install Inno Setup: http://www.jrsoftware.org/isdl.php
- Install Microsoft SDK: http://www.microsoft.com/en-gb/download/details.aspx?id=8279
- Make sure you mount your working directory on E:\ (it's the default if you auto-mount)
- Also ensure that you have ran `gulp build` and that the `opt` folder has a `win32` folder inside of it
- Go into the `E:\windows` folder and run the `build.bat` file

You should end up with a `GitterSetup.exe` file inside `E:\`

## Code Sign

You'll need to sign the Gitter.exe binary and the installer separately.

### SignTool (method used in the build.bat file)

Install Microsoft SDK from: http://www.microsoft.com/en-gb/download/details.aspx?id=8279

Usage: `signtool.exe sign /f troupe-cert.pfx binary.exe`

### kSign

Has a GUI. Very easy to use. Just use the cert provided: `troupe-cert.pfx`

## Inno Setup

`gitter.iss` contains an Inno Setup manifest to generate an installer for Windows.

If you need to modify the Inno Setup file, you can use the Inno Script Studio: https://www.kymoto.org/products/inno-script-studio

Get Inno Setup from: http://www.jrsoftware.org/isdl.php

Generate an installer with: `"C:\Program Files\Inno Setup 5\ISCC.exe" "C:\gitter-desktop\gitter.iss`
