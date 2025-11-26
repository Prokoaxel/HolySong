API endpoints for serverless functions (Vercel)

Environment variables (set in Vercel dashboard or local env):
- SUPABASE_URL - your Supabase project URL
- SUPABASE_SERVICE_KEY - service_role key (kept secret)

Endpoints:
- POST /api/ocr -> accepts multipart/form-data with file field `file`; returns { text }
- POST /api/folders/{id}/songs -> body { song_id }, Authorization: Bearer <access_token> required
- DELETE /api/folders/{id}/songs?songId=... -> Authorization: Bearer <access_token> required

Local testing (with vercel CLI):
- Install dependencies: npm i
- Run with: npx vercel dev
- Example curl request (ocr):
  curl -F "file=@/path/to/file.pdf" http://localhost:3000/api/ocr

Notes:
- OCR implemented using Tesseract.js (language set to 'spa') for Spanish.
- Folder endpoints use Supabase admin key server-side and verify the user via the access token provided in the Authorization header.
