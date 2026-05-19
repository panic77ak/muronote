# App Icons

Place the following icon files here for electron-builder:

- `icon.ico` — Windows (256x256 minimum, multi-size .ico)
- `icon.icns` — macOS (512x512 minimum)
- `icon.png` — Linux fallback (512x512)
- `icons/` — Linux directory with multiple sizes (16x16 to 512x512)

## Generating from SVG

Use the included `icon.svg` as the source and convert with:

```bash
# macOS: use iconutil or https://cloudconvert.com
# Windows: use https://icoconvert.com or ImageMagick
# All platforms: npx electron-icon-builder --input=resources/icon.svg --output=resources
```
