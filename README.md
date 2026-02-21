# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Mobile (Android + iOS) with Capacitor

This repo is prepared to package the same app for Android and iOS using Capacitor.

### One-time setup (already done in this repo)
- `capacitor.config.ts` created
- Native projects generated:
  - `android/`
  - `ios/`

### Daily workflow
1. Build web + sync native assets:
   ```bash
   npm run mobile:build
   ```
2. Open Android Studio:
   ```bash
   npm run mobile:android
   ```
3. Open Xcode (macOS required):
   ```bash
   npm run mobile:ios
   ```

### Extra commands
- Sync only (without web build):
  ```bash
  npm run mobile:sync
  ```
- Copy only:
  ```bash
  npm run mobile:copy
  ```

### Notes
- iOS compilation/signing requires macOS + Xcode.
- Android can be built from Windows using Android Studio.
- Every web change must be followed by `npm run mobile:build` before generating APK/IPA.

## Serverless API (OCR and folder ops)

This project includes serverless API endpoints (for Vercel) under the `api/` directory:
- `POST /api/ocr` - accepts a file (`multipart/form-data` with `file` field) and returns OCR text using Tesseract.js.
- `POST /api/folders/:id/songs` - adds a song to a folder (requires Authorization: Bearer <supabase_access_token>).
- `DELETE /api/folders/:id/songs?songId=` - removes a song from the folder (requires Authorization header).

Environment variables required (set in Vercel dashboard or locally):
- `SUPABASE_URL` - your supabase URL
- `SUPABASE_SERVICE_KEY` - your supabase service role key (server-only)
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` remain for the frontend access.

Local development (optional):
- Install dependencies: `npm install`.
- Run locally with Vercel dev: `npx vercel dev` (or `npm run dev:vercel` if you have vercel installed).
- Test OCR example:
  ```bash
  curl -F "file=@/path/to/file.pdf" http://localhost:3000/api/ocr
  ```


You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
