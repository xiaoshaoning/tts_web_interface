# Edge-TTS Web Interface

A modern web interface for Microsoft Edge TTS text-to-speech conversion.

> **中文文档**：查看 [使用说明.md](./使用说明.md) 获取详细中文使用指南 | [快速开始.md](./快速开始.md) 获取快速入门步骤

## Features

- **Drag & Drop Upload**: Simply drag and drop your text files onto the upload area
- **Multiple File Formats**: Supports .txt, .doc, .docx, and .pdf files
- **Voice Selection**: Choose from different neural voices (default: en-US-MichelleNeural)
- **Audio Preview**: Listen to generated audio directly in the browser
- **Download**: Download the generated WAV files
- **Modern UI**: Clean, responsive design inspired by CSS Design Awards

## Prerequisites

1. **Node.js** (v14 or higher)
2. **edge-tts** command line tool installed globally

### Install edge-tts
```bash
pip install edge-tts
```

## Installation

1. Clone or download this project
2. Install dependencies:
```bash
npm install
```

## Usage

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3001
```

3. Upload a text file by:
   - Clicking the upload area and selecting a file
   - Dragging and dropping a file onto the upload area

4. Select a voice (optional, defaults to en-US-MichelleNeural)

5. Click "Convert to Speech"

6. Wait for processing to complete

7. Listen to the audio using the built-in player or download the WAV file

## Project Structure

```
D:\English\
├── public/                 # Frontend files
│   ├── index.html         # Main HTML page
│   ├── style.css          # Stylesheet
│   └── script.js          # Frontend JavaScript
├── server.js              # Node.js backend server
├── package.json           # Node.js dependencies
├── uploads/               # Temporary uploaded files (auto-created)
├── outputs/               # Generated audio files (auto-created)
└── README.md              # This file
```

## API Endpoints

- `GET /` - Serve the main HTML page
- `POST /convert` - Convert uploaded text file to speech
- `GET /outputs/:filename` - Download generated audio files
- `GET /voices` - List available voices (requires edge-tts)

## Troubleshooting

### edge-tts not found
Ensure edge-tts is installed and available in your PATH:
```bash
edge-tts --version
```

### Port 3001 already in use
Modify the port in `server.js` line 9:
```javascript
const port = 3001; // Change to an available port
```

### File upload fails
- Check file size (limit: 10MB)
- Ensure file is a supported format (.txt, .doc, .docx, .pdf)
- Check server console for error messages

## License

MIT

## Credits

- Design inspired by [CSS Design Awards](https://www.cssdesignawards.com/)
- TTS powered by [Microsoft Edge TTS](https://github.com/rany2/edge-tts)
- Icons from [Font Awesome](https://fontawesome.com/)
- Fonts from [Google Fonts](https://fonts.google.com/)