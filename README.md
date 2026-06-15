# Eau de Printemps — Pastel Water Ripples

A dreamy pastel water-surface web experience with translucent flowers, sparkling caustic light, elegant ripples, and touch/mouse interaction.

## Features

- Vertical 9:16 mobile-wallpaper composition
- Touch-reactive circular water ripples
- Animated sparkling caustic light overlays
- Floating translucent petal particles
- Glassmorphism control panel
- Snapshot/download button
- Static HTML/CSS/JS, no build step required

## File structure

```text
flower-water-ripples/
├─ index.html
├─ style.css
├─ script.js
├─ assets/
│  └─ flower-water.png
└─ .github/
   └─ workflows/
      └─ deploy.yml
```

## Run locally

Open `index.html` directly in your browser, or run a simple local server:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Deploy to GitHub Pages

### Option 1 — Upload manually

1. Create a new GitHub repository, for example `flower-water-ripples`.
2. Upload all files from this folder into the repository root.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose **GitHub Actions**.
5. The included workflow will publish the site automatically after you push to `main`.

### Option 2 — Push from terminal

```bash
git init
git add .
git commit -m "Add pastel flower water ripple experience"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/flower-water-ripples.git
git push -u origin main
```

Then enable GitHub Pages using **GitHub Actions** in repository settings.

## Customization

- Replace `assets/flower-water.png` to change the visual base.
- Adjust default slider values in `index.html`.
- Tune animation behavior in `script.js`.
- Adjust glassmorphism, colors, and layout in `style.css`.
