# Pure Grow Farm Website Files

Ye folder complete website package hai.

## Files

- `index.html` - main website
- `download-app.html` - app install page
- `manifest.webmanifest` - PWA manifest
- `sw.js` - service worker
- `offline.html` - offline page
- `mushroom/` - website images
- `app/icon-192.png` and `app/icon-512.png` - app icons
- `Code.gs` - Google Apps Script backend for Google Sheet save and farm email notification

## Google Sheet setup

1. `script.google.com` open karo.
2. New project banao.
3. `Code.gs` ka code paste karo.
4. `Deploy` -> `New deployment` -> `Web app`.
5. `Execute as`: `Me`.
6. `Who has access`: `Anyone`.
7. Deploy karo aur Web App URL copy karo.

## Website me API URL lagana

`index.html` me ye line dhundo:

```js
const FARM_API_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";
```

Isme apna Apps Script Web App URL paste karo.

## Deploy

Vercel me ye folder upload/deploy kar do. Confirm button dabne par:

- customer ke browser me Excel/CSV download nahi hogi
- data farm ki Google Sheet me save hoga
- `puregrowfarm001@gmail.com` par notification email jayega

## Note

Google Sheet Excel jaisi file hai. Aap Google Sheet se kabhi bhi `File -> Download -> Microsoft Excel (.xlsx)` kar sakte ho.
