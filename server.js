const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const app = express();
const port = 3001;

// Enable CORS
app.use(cors());

// Configure multer for file upload
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Ensure upload directories exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}
if (!fs.existsSync('outputs')) {
  fs.mkdirSync('outputs');
}

// Static file serving
app.use(express.static('public'));
app.use('/outputs', express.static('outputs'));

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// File upload and TTS conversion endpoint
app.post('/convert', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const inputPath = req.file.path;
  const originalName = req.file.originalname;
  const baseName = path.basename(originalName, path.extname(originalName));
  const outputPath = path.join(__dirname, 'outputs', `${baseName}.wav`);
  const voice = req.body.voice || 'en-US-MichelleNeural';

  // Read uploaded file content
  fs.readFile(inputPath, 'utf8', (err, text) => {
    if (err) {
      // If reading fails (may be binary file), use file path directly
      runEdgeTTS(inputPath, outputPath, voice, baseName, res);
    } else {
      // If text file, use text content directly
      runEdgeTTSWithText(text, outputPath, voice, baseName, res);
    }
  });
});

// Run edge-tts with text content
function runEdgeTTSWithText(text, outputPath, voice, baseName, res) {
  // Write text to temporary file
  const tempFilePath = path.join(__dirname, 'uploads', `temp_${Date.now()}.txt`);
  fs.writeFile(tempFilePath, text, 'utf8', (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to create temp file' });
    }

    runEdgeTTS(tempFilePath, outputPath, voice, baseName, res, () => {
      // Clean up temporary file
      fs.unlink(tempFilePath, (unlinkErr) => {
        if (unlinkErr) console.error('Failed to delete temp file:', unlinkErr);
      });
    });
  });
}

// Run edge-tts command
function runEdgeTTS(inputPath, outputPath, voice, baseName, res, cleanupCallback) {
  const command = `edge-tts -f "${inputPath}" --write-media "${outputPath}" -v ${voice}`;

  console.log(`Running command: ${command}`);

  exec(command, (error, stdout, stderr) => {
    if (cleanupCallback) cleanupCallback();

    if (error) {
      console.error('Error executing edge-tts:', error);
      console.error('stderr:', stderr);
      return res.status(500).json({
        error: 'TTS conversion failed',
        details: stderr || error.message
      });
    }

    console.log('edge-tts output:', stdout);

    // Check if output file exists
    if (fs.existsSync(outputPath)) {
      const audioUrl = `/outputs/${baseName}.wav`;
      res.json({
        success: true,
        message: 'Conversion successful',
        audioUrl: audioUrl,
        fileName: `${baseName}.wav`
      });
    } else {
      res.status(500).json({
        error: 'Output file was not created',
        details: 'edge-tts may have failed silently'
      });
    }
  });
}

// Get available voices list (if needed)
app.get('/voices', (req, res) => {
  exec('edge-tts --list-voices', (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: 'Failed to get voices list' });
    }

    const voices = parseVoices(stdout);
    res.json(voices);
  });
});

// Parse edge-tts voices output
function parseVoices(output) {
  const lines = output.trim().split('\n');
  const voices = [];

  for (let i = 1; i < lines.length; i++) { // Skip header line
    const line = lines[i];
    if (line.trim()) {
      const parts = line.split(' ');
      if (parts.length >= 2) {
        voices.push(parts[0]); // Voice name
      }
    }
  }

  return voices;
}

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Make sure edge-tts is installed and accessible from command line`);
});