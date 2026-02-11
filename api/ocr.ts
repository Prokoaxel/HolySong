import { createWorker } from 'tesseract.js'
import formidable from 'formidable'
import fs from 'fs'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export const config = {
  api: {
    bodyParser: false,
  },
}

const MAX_FILE_SIZE = 8 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/bmp',
  'image/webp',
  'image/tiff',
])

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const form = formidable({
    keepExtensions: true,
    multiples: false,
    maxFiles: 1,
    maxFileSize: MAX_FILE_SIZE,
    allowEmptyFiles: false,
  })

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parse error', err)
      const message = err.message?.toLowerCase() ?? ''
      if (message.includes('maxfilesize') || message.includes('max file size')) {
        return res.status(413).json({ error: 'File too large. Max 8MB.' })
      }
      return res.status(400).json({ error: 'Failed to parse file' })
    }

    const fileField = files?.file
    const file = Array.isArray(fileField) ? fileField[0] : fileField
    if (!file) {
      return res.status(400).json({ error: 'No file found' })
    }

    const filePath = file.filepath || (file as any).path
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(400).json({ error: 'Invalid file upload' })
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype || '')) {
      try {
        fs.unlinkSync(filePath)
      } catch (_e) {
        // ignore temp file cleanup errors
      }
      return res.status(415).json({ error: 'Unsupported file type' })
    }

    if ((file.size || 0) > MAX_FILE_SIZE) {
      try {
        fs.unlinkSync(filePath)
      } catch (_e) {
        // ignore temp file cleanup errors
      }
      return res.status(413).json({ error: 'File too large. Max 8MB.' })
    }

    let worker: Awaited<ReturnType<typeof createWorker>> | null = null

    try {
      worker = await createWorker({
        logger: m => console.log(m),
      })

      await worker.loadLanguage('spa+eng')
      await worker.initialize('spa+eng')

      const { data: { text } } = await worker.recognize(filePath)
      return res.status(200).json({ text })
    } catch (error) {
      console.error('OCR error', error)
      return res.status(500).json({ error: 'Failed during OCR' })
    } finally {
      if (worker) {
        try {
          await worker.terminate()
        } catch (_e) {
          // ignore worker termination errors
        }
      }
      try {
        fs.unlinkSync(filePath)
      } catch (_e) {
        // ignore temp file cleanup errors
      }
    }
  })
}
