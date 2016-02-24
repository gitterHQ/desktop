echo "Parameter 1: version x.x.x"
echo "Parameter 2: .pfx password"

if "%1"=="" (
  echo "please provide a version x.x.x"
) else (
  "C:\Program Files (x86)\Microsoft SDKs\Windows\v7.1A\Bin\signtool.exe" sign /f "%cd%\certificates\troupe-cert.pfx" /p "%2" "%cd%\opt\Gitter\win32\Gitter.exe"
  "C:\Program Files (x86)\Inno Setup 5\ISCC.exe" "%cd%\windows\gitter.iss"
  "C:\Program Files (x86)\Microsoft SDKs\Windows\v7.1A\Bin\signtool.exe" sign /f "%cd%\certificates\troupe-cert.pfx" /p "%2" "%cd%\artefacts\GitterSetup*"
  rename "%cd%\artefacts\GitterSetup.exe" "GitterSetup-%1%.exe"
)
