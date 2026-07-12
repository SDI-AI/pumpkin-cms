# Pumpkin Default Theme Package

Installable compiled package for the default Pumpkin starter theme.

Create a zip for local install testing:

```powershell
Compress-Archive -Path theme-packages\pumpkin-default\* -DestinationPath .tmp\pumpkin-default-theme.zip -Force
```

Use this package to reinstall or switch back to the default theme through the starter admin theme installer. The in-app fallback theme should remain in place for first-run or empty-database scenarios.
