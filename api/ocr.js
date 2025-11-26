const { createWorker } = require('tesseract.js')
const formidable = require('formidable')
const fs = require('fs')

// Disable default body parser in Vercel/Next-like handlers by checking 'content-type' and using formidable
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const form = formidable({ keepExtensions: true })

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parse error', err)
      return res.status(500).json({ error: 'Failed to parse file' })
    }

    const file = files?.file
    if (!file) return res.status(400).json({ error: 'No file found' })

    const filePath = file.filepath || file.path || file.path

    try {
      const worker = createWorker()
      await worker.load()
      await worker.loadLanguage('spa')
      await worker.initialize('spa')
      const { data } = await worker.recognize(filePath)
      await worker.terminate()

      // Clean
      try { fs.unlinkSync(filePath) } catch (_) {}

      return res.status(200).json({ text: data?.text || '' })
    } catch (error) {
      console.error('OCR error', error)
      return res.status(500).json({ error: 'Failed during OCR' })
    }
  })
}
