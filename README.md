# Vinyl KALLAX Catalog

Catalog static interactiv pentru colecția de viniluri, organizat pe categorii KALLAX. Interfața rulează complet în browser: căutare, filtrare, sortare și fișe de detaliu, fără backend sau bază de date.

## Publicare gratuită pe GitHub Pages

1. Creează un repository public pe GitHub și urcă toate fișierele proiectului.
2. Folosește branch-ul `main`; workflow-ul din `.github/workflows/deploy-pages.yml` va rula automat la fiecare push.
3. În repository, deschide **Settings → Pages** și setează **Source: GitHub Actions**.
4. După finalizarea workflow-ului, site-ul va fi disponibil la `https://NUME-UTILIZATOR.github.io/NUME-REPOSITORY/`.

Workflow-ul setează automat `VITE_BASE_PATH`, astfel încât aplicația Vite să funcționeze corect într-un subdirector GitHub Pages. Nu sunt necesare chei API, hosting extern, server sau servicii plătite.

## Dezvoltare locală

```bash
pnpm install
pnpm dev
```

Pentru verificarea build-ului GitHub Pages:

```bash
VITE_BASE_PATH=/numele-repository-ului/ pnpm build
```
