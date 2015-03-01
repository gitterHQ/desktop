if "%1"=="" (
  echo "please provide a version x.x.x"
) else (
  "C:\Program Files\Microsoft SDKs\Windows\v7.1\Bin\signtool.exe" sign /f "E:\certificates\troupe-cert.pfx" "E:\opt\Gitter\win32\Gitter.exe"
  "C:\Program Files\Inno Setup 5\ISCC.exe" "E:\windows\gitter.iss"
  "C:\Program Files\Microsoft SDKs\Windows\v7.1\Bin\signtool.exe" sign /f "E:\certificates\troupe-cert.pfx" "E:\artefacts\GitterSetup*"
  rename "E:\artefacts\GitterSetup.exe" "GitterSetup-%1%.exe"
)
