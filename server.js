import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { exec } from 'child_process';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve the public directory so the frontend can load the HTML report
app.use('/qou', express.static(path.join(__dirname, 'public', 'qou')));

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'placeholder'
);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'public', 'qou'));
  },
  filename: function (req, file, cb) {
    // Preserve original filename including Arabic characters
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

app.post('/api/upload', upload.array('files'), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'لم يتم استلام أي ملفات' });
  }

  const fileNames = req.files.map(f => f.filename);
  console.log(`Received files: ${fileNames.join(', ')}`);

  // Optional: Log to Supabase if valid URL provided
  try {
    if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
      const logs = fileNames.map(name => ({ filename: name, upload_time: new Date().toISOString() }));
      const { error } = await supabase.from('uploads_log').insert(logs);
      if (error) console.warn("Supabase log warning:", error.message);
    }
  } catch (err) {
    console.error('Supabase log error:', err.message);
  }

  // Execute python script
  console.log('Running python script to regenerate HTML...');
  exec('python generate_html_report.py', { cwd: path.join(__dirname, 'public', 'qou') }, async (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing python script: ${error}`);
      return res.status(500).json({ error: 'فشل في تحديث التقرير', details: stderr });
    }
    
    console.log(`Python Output: ${stdout}`);

    // Upload generated HTML to Supabase
    let reportUrl = null;
    try {
      const htmlPath = path.join(__dirname, 'public', 'qou', 'تقرير_المتابعة_التفاعلي_v3.html');
      if (fs.existsSync(htmlPath)) {
        const htmlContent = fs.readFileSync(htmlPath);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('reports')
          .upload('تقرير_المتابعة_التفاعلي_v3.html', htmlContent, {
            contentType: 'text/html',
            upsert: true
          });
          
        if (uploadError) {
          console.error("Supabase Upload Error:", uploadError.message);
        } else {
          // Get public URL
          const { data } = supabase.storage.from('reports').getPublicUrl('تقرير_المتابعة_التفاعلي_v3.html');
          reportUrl = data.publicUrl;
          console.log("Successfully uploaded report to Supabase:", reportUrl);
        }
      }
    } catch (e) {
      console.error("Error during Supabase upload:", e);
    }

    res.json({ 
        message: `تم رفع ${fileNames.length} ملف وتحديث التقرير بنجاح!`, 
        files: fileNames,
        reportUrl: reportUrl
    });
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
