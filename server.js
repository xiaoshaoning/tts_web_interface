const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const franc = require('franc');
const langs = require('languages');
const net = require('net');
const app = express();
const port = 3001;

// Language to default voice mapping for edge-tts
// Based on commonly available neural voices in edge-tts
const LANGUAGE_VOICE_MAP = {
  // English variants
  'en': 'en-US-MichelleNeural',    // Default English (US female)
  'en-US': 'en-US-MichelleNeural',
  'en-GB': 'en-GB-SoniaNeural',

  // French
  'fr': 'fr-FR-DeniseNeural',      // French (France female)
  'fr-FR': 'fr-FR-DeniseNeural',
  'fr-CA': 'fr-CA-SylvieNeural',

  // German
  'de': 'de-DE-KatjaNeural',       // German (Germany female)
  'de-DE': 'de-DE-KatjaNeural',
  'de-AT': 'de-AT-IngridNeural',
  'de-CH': 'de-CH-LeniNeural',

  // Chinese
  'zh': 'zh-CN-XiaoxiaoNeural',    // Chinese (Mandarin, Simplified China female)
  'zh-CN': 'zh-CN-XiaoxiaoNeural',
  'zh-TW': 'zh-TW-HsiaoChenNeural',
  'zh-HK': 'zh-HK-HiuMaanNeural',

  // Spanish
  'es': 'es-ES-ElviraNeural',      // Spanish (Spain female)
  'es-ES': 'es-ES-ElviraNeural',
  'es-MX': 'es-MX-DaliaNeural',

  // Italian
  'it': 'it-IT-ElsaNeural',        // Italian (Italy female)

  // Japanese
  'ja': 'ja-JP-NanamiNeural',      // Japanese (Japan female)

  // Korean
  'ko': 'ko-KR-SunHiNeural',       // Korean (Korea female)

  // Portuguese
  'pt': 'pt-BR-FranciscaNeural',   // Portuguese (Brazil female)
  'pt-BR': 'pt-BR-FranciscaNeural',
  'pt-PT': 'pt-PT-FernandaNeural',

  // Russian
  'ru': 'ru-RU-SvetlanaNeural',    // Russian (Russia female)

  // Arabic
  'ar': 'ar-SA-ZariyahNeural',     // Arabic (Saudi Arabia female)

  // Hindi
  'hi': 'hi-IN-SwaraNeural',       // Hindi (India female)

  // Dutch
  'nl': 'nl-NL-ColetteNeural',     // Dutch (Netherlands female)

  // Polish
  'pl': 'pl-PL-AgnieszkaNeural',   // Polish (Poland female)

  // Turkish
  'tr': 'tr-TR-EmelNeural',        // Turkish (Turkey female)

  // Swedish
  'sv': 'sv-SE-SofieNeural',       // Swedish (Sweden female)

  // Default fallback
  'default': 'en-US-MichelleNeural'
};

// ISO 639-3 to ISO 639-1 language code mapping
// franc returns ISO 639-3 codes, but our voice mapping uses ISO 639-1
const ISO6393_TO_ISO6391 = {
  'cmn': 'zh', // Chinese
  'eng': 'en', // English
  'fra': 'fr', // French
  'deu': 'de', // German
  'spa': 'es', // Spanish
  'ita': 'it', // Italian
  'jpn': 'ja', // Japanese
  'kor': 'ko', // Korean
  'rus': 'ru', // Russian
  'ara': 'ar', // Arabic
  'hin': 'hi', // Hindi
  'por': 'pt', // Portuguese
  'nld': 'nl', // Dutch
  'pol': 'pl', // Polish
  'tur': 'tr', // Turkish
  'swe': 'sv', // Swedish
  'yue': 'zh', // Cantonese (map to Chinese)
  'nan': 'zh', // Min Nan Chinese
  'wuu': 'zh', // Wu Chinese
  'ces': 'cs', // Czech
  'dan': 'da', // Danish
  'ell': 'el', // Greek
  'fin': 'fi', // Finnish
  'heb': 'he', // Hebrew
  'hun': 'hu', // Hungarian
  'ind': 'id', // Indonesian
  'lav': 'lv', // Latvian
  'lit': 'lt', // Lithuanian
  'nor': 'no', // Norwegian
  'ron': 'ro', // Romanian
  'slk': 'sk', // Slovak
  'slv': 'sl', // Slovenian
  'tha': 'th', // Thai
  'ukr': 'uk', // Ukrainian
  'vie': 'vi'  // Vietnamese
};

// Function to detect language from text and return appropriate voice
function detectLanguageAndVoice(text) {
  try {
    // Detect language using franc (returns ISO 639-3 codes)
    const langCodeISO6393 = franc(text, { minLength: 3 });

    if (langCodeISO6393 === 'und') {
      // Language could not be detected
      console.log('Language detection failed, using default voice');
      return LANGUAGE_VOICE_MAP['default'];
    }

    // Convert ISO 639-3 to ISO 639-1 if possible
    let langCode = langCodeISO6393;
    if (ISO6393_TO_ISO6391[langCodeISO6393]) {
      langCode = ISO6393_TO_ISO6391[langCodeISO6393];
    }

    // Get language name and details
    const language = langs.getLanguageInfo(langCode);
    console.log(`Detected language: ${language ? language.name : 'Unknown'} (${langCodeISO6393} -> ${langCode})`);

    // Try to find exact match first (e.g., 'zh-CN')
    // First check if we have a region-specific mapping
    // For Chinese, try zh-CN, zh-TW, zh-HK based on possible regions
    // For now, use the base language code

    // Try to find by base language code (e.g., 'zh' for Chinese)
    const baseLangCode = langCode.split('-')[0];
    if (LANGUAGE_VOICE_MAP[baseLangCode]) {
      return LANGUAGE_VOICE_MAP[baseLangCode];
    }

    // Try direct match as fallback
    if (LANGUAGE_VOICE_MAP[langCode]) {
      return LANGUAGE_VOICE_MAP[langCode];
    }

    // Fallback to default
    console.log(`No voice mapping found for language code: ${langCodeISO6393} (converted to: ${langCode}), using default`);
    return LANGUAGE_VOICE_MAP['default'];
  } catch (error) {
    console.error('Error in language detection:', error);
    return LANGUAGE_VOICE_MAP['default'];
  }
}

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
  const userSpecifiedVoice = req.body.voice; // User may specify a voice

  // Read uploaded file content
  fs.readFile(inputPath, 'utf8', (err, text) => {
    if (err) {
      // If reading fails (may be binary file), use file path directly
      // For binary files, we can't detect language from content
      const voice = (userSpecifiedVoice && userSpecifiedVoice.trim() !== '')
        ? userSpecifiedVoice
        : LANGUAGE_VOICE_MAP['default'];
      runEdgeTTS(inputPath, outputPath, voice, baseName, res);
    } else {
      // If text file, use text content directly
      let voice;
      if (userSpecifiedVoice && userSpecifiedVoice.trim() !== '') {
        // Use user-specified voice if provided and not empty
        voice = userSpecifiedVoice;
        console.log(`Using user-specified voice: ${voice}`);
      } else {
        // Auto-detect language and select appropriate voice
        voice = detectLanguageAndVoice(text);
        console.log(`Auto-detected voice: ${voice}`);
      }
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

// Function to check if a port is available
function checkPort(port, maxAttempts = 10) {
  return new Promise((resolve, reject) => {
    function tryPort(currentPort, attempt = 1) {
      if (attempt > maxAttempts) {
        reject(new Error(`Could not find available port after ${maxAttempts} attempts`));
        return;
      }

      const server = net.createServer();

      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${currentPort} is in use, trying ${currentPort + 1}...`);
          server.close();
          tryPort(currentPort + 1, attempt + 1);
        } else {
          reject(err);
        }
      });

      server.once('listening', () => {
        server.close();
        resolve(currentPort);
      });

      server.listen(currentPort);
    }

    tryPort(port);
  });
}

// Start server with port checking
checkPort(port)
  .then((availablePort) => {
    if (availablePort !== port) {
      console.log(`Port ${port} is in use, using port ${availablePort} instead`);
    }

    app.listen(availablePort, () => {
      console.log(`Server running at http://localhost:${availablePort}`);
      console.log(`Make sure edge-tts is installed and accessible from command line`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });