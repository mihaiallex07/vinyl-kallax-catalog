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

## Configurare Firebase pentru colecția comună

Aplicația folosește Firebase Authentication cu Google și Cloud Firestore. Fișierul `firestore.rules` limitează citirea și scrierea colecției `vinylRecords` la adresele Google autorizate ale proprietarilor.

În Firebase Console, intră la **Firestore Database → Rules**, înlocuiește regulile existente cu conținutul fișierului `firestore.rules`, apoi apasă **Publish**. În **Authentication → Sign-in method**, providerul Google trebuie să fie Enabled, iar în **Authentication → Settings → Authorized domains** trebuie să existe `mihaiallex07.github.io`.

La prima autentificare a unuia dintre cele două conturi, aplicația va inițializa automat Firestore cu cele 127 de discuri din catalog. După aceea, orice disc nou adăugat de unul dintre voi va fi vizibil și pentru celălalt. Datele nu mai sunt salvate în localStorage ca sursă principală.
