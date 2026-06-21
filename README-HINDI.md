# Pure Grow Farm website app

Ye folder complete website/app hai. `index.html` browser me open kar sakte ho, ya Vercel par deploy kar sakte ho.

## Data Excel me save kaise hoga

- Website par order/visit submit karne se data browser ke hidden local storage me save hota hai.
- Website par data table/list me show nahi hota.
- `Download Excel Backup` button se `pure-grow-farm-data.xlsx` download hoti hai.
- Static website direct server par Excel file update nahi kar sakti. Agar farm ke Google Drive me permanent Sheet chahiye to `../puregrowfarm-data-save/Code.gs` wala Google Apps Script setup use karo.

## Image change kaise kare

1. Nayi image `mushroom` folder me paste karo.
2. `app.js` me `siteImages` object ke andar path change karo.
3. Example:

```js
hero: "mushroom/new-home-image.jpg"
```

## App install/download

Website PWA hai. Browser me open/deploy karne ke baad supported browser me `Install` button dikh sakta hai. User app ko mobile/desktop par install kar sakta hai.

## Important files

- `index.html` - website page
- `styles.css` - design
- `app.js` - products, image paths, save, Excel export
- `manifest.webmanifest` - app install settings
- `service-worker.js` - offline cache
- `mushroom/` - all used images
