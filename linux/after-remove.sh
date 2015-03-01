#!/bin/bash

# removing what we added on after-install
libpaths=(
  "/lib/x86_64-linux-gnu" # Ubuntu, Xubuntu, Mint
  "/usr/lib64" # SUSE, Fedora
  "/usr/lib" # Arch, Fedora 32bit
  "/lib/i386-linux-gnu" # Ubuntu 32bit
)
 
for i in "${libpaths[@]}"
do
  if [ -f "$i/libudev.so.0" ]
  then
    rm "$i/libudev.so.0"
    break
  fi
done

# Link to the Gitter binary
rm /usr/local/bin/gitter

# Unity Launcher icon
rm /usr/share/applications/gitter.desktop
