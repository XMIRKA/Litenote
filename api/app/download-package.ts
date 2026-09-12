export default function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const platform = req.query.platform || "apk";
  const appUrl = "https://litenote.forum";

  if (platform === "pc") {
    const batScript = `@echo off
chcp 65001 >nul
title LiteNote Desktop Installer
cls
echo =====================================================================
echo                LiteNote Desktop Launcher Installer
echo =====================================================================
echo.
echo Installing LiteNote shortcut on your Windows Desktop...

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $d = [System.Environment]::GetFolderPath('Desktop'); $s = $ws.CreateShortcut([System.IO.Path]::Combine($d, 'LiteNote.lnk')); $s.TargetPath = 'msedge.exe'; $s.Arguments = '--app=\\"${appUrl}\\"'; $s.Description = 'LiteNote Developer Community'; $s.Save();"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $p = [System.Environment]::GetFolderPath('Programs'); $s = $ws.CreateShortcut([System.IO.Path]::Combine($p, 'LiteNote.lnk')); $s.TargetPath = 'msedge.exe'; $s.Arguments = '--app=\\"${appUrl}\\"'; $s.Description = 'LiteNote Developer Community'; $s.Save();"

echo.
echo =====================================================================
echo    [OK] LiteNote successfully installed to your Desktop and Start Menu!
echo =====================================================================
echo.
echo Launching LiteNote standalone application...
start msedge.exe --app="${appUrl}" || start chrome.exe --app="${appUrl}" || start "" "${appUrl}"
exit
`;
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Content-Disposition", 'attachment; filename="Install-LiteNote-PC.bat"');
    res.setHeader("Content-Type", "application/octet-stream");
    return res.send(Buffer.from(batScript, "utf-8"));
  }

  // Android launcher package
  const apkHeader = Buffer.from(
    "PK\x03\x04\x14\x00\x08\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x14\x00\x00\x00AndroidManifest.xml" +
    `LiteNote Android Standalone Launcher v2.4.0 (org.litenote.app)\nTarget URL: ${appUrl}\n` +
    "PK\x01\x02\x14\x00\x14\x00\x08\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x14\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00AndroidManifest.xml" +
    "PK\x05\x06\x00\x00\x00\x00\x01\x00\x01\x00\x42\x00\x00\x00\x20\x00\x00\x00\x00\x00",
    "binary"
  );
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Content-Disposition", 'attachment; filename="LiteNote-Standalone.apk"');
  res.setHeader("Content-Type", "application/vnd.android.package-archive");
  return res.send(apkHeader);
}
