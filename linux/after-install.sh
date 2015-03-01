#!/bin/bash
 
libpaths=(
  "/lib/x86_64-linux-gnu" # Ubuntu, Xubuntu, Mint
  "/usr/lib64" # SUSE, Fedora
  "/usr/lib" # Arch, Fedora 32bit
  "/lib/i386-linux-gnu" # Ubuntu 32bit
)
 
for i in "${libpaths[@]}"
do
  if [ -f "$i/libudev.so.1" ]
  then
    ln -sf "$i/libudev.so.1" "$i/libudev.so.0"
    break
  fi
done

# Link to the Gitter binary
ln -sf /opt/Gitter/{{arch}}/Gitter /usr/local/bin/gitter

# Unity Launcher icon
desktop-file-install /opt/Gitter/{{arch}}/gitter.desktop
