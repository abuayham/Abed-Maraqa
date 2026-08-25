import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { exec } from 'child_process';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'placeholder'
);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'qou'));
  },
  filename: function (req, file, cb) {
    // Preserve original filename including Arabic characters
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'لم يتم استلام أي ملف' });
  }

  const fileName = req.file.filename;
  console.log(`Received file: ${fileName}`);

  // Optional: Log to Supabase if valid URL provided
  try {
    if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      const { error } = await supabase.from('uploads_log').insert([{ filename: fileName, upload_time: new Date().toISOString() }]);
      if (error) console.warn("Supabase log warning:", error.message);
    }
  } catch (err) {
    console.error('Supabase log error:', err.message);
  }

  // Execute python script
  console.log('Running python script to regenerate HTML...');
  exec('python generate_html_report.py', { cwd: path.join(__dirname, 'qou') }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing python script: ${error}`);
      return res.status(500).json({ error: 'فشل في تحديث التقرير', details: stderr });
    }
    
    console.log(`Python Output: ${stdout}`);
    res.json({ message: 'تم رفع الملف وتحديث التقرير بنجاح!', file: fileName });
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
