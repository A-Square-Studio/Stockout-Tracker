import { Router } from 'express';
import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

  try {
    const data = await pdfParse(req.file.buffer);
    // Return raw extracted text — client will parse it as CSV-like rows
    res.json({ text: data.text });
  } catch (err) {
    res.status(422).json({ error: 'Could not read PDF. Make sure it contains selectable text (not a scanned image).' });
  }
});

export default router;
