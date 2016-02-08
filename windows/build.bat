if "%1"=="" (
  echo "please provide a version x.x.x"
) else (
  "C:\Program Files (x86)\Microsoft SDKs\Windows\v8.1\Bin\signtool.exe" sign /f "Z:\certificates\troupe-cert.pfx" "Z:\opt\Gitter\win32\Gitter.exe"
  "C:\Program Files (x86)\Inno Setup 5\ISCC.exe" "Z:\windows\gitter.iss"
  "C:\Program Files (x86)\Microsoft SDKs\Windows\v8.1\Bin\signtool.exe" sign /f "Z:\certificates\troupe-cert.pfx" "Z:\artefacts\GitterSetup*"
  rename "Z:\artefacts\GitterSetup.exe" "GitterSetup-%1%.exe"
)
