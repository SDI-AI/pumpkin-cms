# Pumpkin Evergreen Theme Package

Installable compiled theme package for the starter app theme installer.

Package contents:

```text
theme.json
theme.css
theme-manifest.json
assets/
```

Create a zip for local install testing:

```powershell
Compress-Archive -Path theme-packages\pumpkin-evergreen\* -DestinationPath .tmp\pumpkin-evergreen-theme.zip -Force
```

Then use the starter admin theme page and choose `Install Package`.
