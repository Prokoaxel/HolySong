import { createWorker } from 'tesseract.js'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const form = new formidable.IncomingForm({ keepExtensions: true })

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parse error', err)
      return res.status(500).json({ error: 'Failed to parse file' })
    }

    // expecting field 'file'
    // @ts-ignore
    const file = files?.file
    if (!file) {
      return res.status(400).json({ error: 'No file found' })
    }

    const filePath = file.filepath || file.path || file.path

    try {
      const worker = await createWorker({
        logger: m => console.log(m),
      })

      await worker.load()
      // load Spanish and English to be safe; user uses Spanish
      await worker.loadLanguage('spa+eng')
      await worker.initialize('spa+eng')

      const { data: { text } } = await worker.recognize(filePath)

      await worker.terminate()

      // optional: delete temp file
      try {
        fs.unlinkSync(filePath)
      } catch (e) {
        // ignore
      }

      return res.status(200).json({ text })
    } catch (error) {
      console.error('OCR error', error)
      return res.status(500).json({ error: 'Failed during OCR' })
    }
  })
}
