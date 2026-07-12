# Pumpkin Theme Packages

Installable compiled theme package sources for starter app testing.

Available packages:

- `pumpkin-default`: the default Pumpkin starter theme, packaged for runtime install and switch-back testing.
- `pumpkin-evergreen`: an alternate Pumpkin theme for validating runtime theme installs.

Build local zip artifacts:

```powershell
Compress-Archive -Path theme-packages\pumpkin-default\* -DestinationPath .tmp\pumpkin-default-theme.zip -Force
Compress-Archive -Path theme-packages\pumpkin-evergreen\* -DestinationPath .tmp\pumpkin-evergreen-theme.zip -Force
```

Install either zip from the starter admin theme page with `Install Package`, then activate the desired theme.

Keep the starter app fallback theme in code. These packages are for normal runtime install/switching; the fallback covers first-run, empty-database, and recovery scenarios.
