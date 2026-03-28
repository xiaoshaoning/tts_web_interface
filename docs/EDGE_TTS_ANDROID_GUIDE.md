# Edge-TTS on Android Guide

This guide provides comprehensive methods to run Microsoft Edge TTS on Android devices, from simple terminal solutions to full application development.

## Table of Contents
1. [Quick Start (Recommended)](#quick-start-recommended)
2. [Termux Solution](#termux-solution)
3. [Pydroid 3 Solution](#pydroid-3-solution)
4. [APK Packaging Solutions](#apk-packaging-solutions)
5. [Alternative Approaches](#alternative-approaches)
6. [Practical Considerations](#practical-considerations)
7. [Troubleshooting](#troubleshooting)
8. [Performance Optimization](#performance-optimization)

## Quick Start (Recommended)

For most users, the simplest solution is using **Termux**:

```bash
# 1. Install Termux from F-Droid (recommended) or Google Play
# 2. Run these commands in Termux:

pkg update && pkg upgrade
pkg install python python-pip git ffmpeg
pip install edge-tts

# Test installation
edge-tts --version
edge-tts --list-voices
```

## Termux Solution

### Installation Steps

1. **Install Termux**
   - Recommended: [F-Droid version](https://f-droid.org/en/packages/com.termux/)
   - Alternative: Google Play Store (may be older version)

2. **Set Up Environment**
   ```bash
   # Grant storage permissions
   termux-setup-storage

   # Update packages
   pkg update && pkg upgrade

   # Install dependencies
   pkg install python python-pip git ffmpeg
   ```

3. **Install Edge-TTS**
   ```bash
   pip install edge-tts

   # Verify installation
   edge-tts --version
   ```

### Basic Usage
```bash
# Create test file
echo "Hello from edge-tts on Android!" > test.txt

# Convert text to speech
edge-tts -f test.txt --write-media output.wav -v en-US-MichelleNeural

# Install audio player
pkg install mpv

# Play the audio
mpv output.wav
```

### Convenience Script
```bash
# Create a reusable script
cat > ~/tts.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
echo "=== Edge-TTS Converter for Android ==="
echo ""

INPUT=$1
OUTPUT=$2
VOICE=${3:-"en-US-MichelleNeural"}

if [ -z "$INPUT" ] || [ -z "$OUTPUT" ]; then
    echo "Usage: tts.sh <input.txt> <output.wav> [voice]"
    echo "Example: tts.sh mytext.txt audio.wav en-US-GuyNeural"
    exit 1
fi

echo "Converting: $INPUT → $OUTPUT"
echo "Voice: $VOICE"
echo ""

edge-tts -f "$INPUT" --write-media "$OUTPUT" -v "$VOICE"

if [ $? -eq 0 ]; then
    echo "✓ Success! Audio saved to: $OUTPUT"
    echo "  Play with: mpv $OUTPUT"
    echo "  File location: $(pwd)/$OUTPUT"
else
    echo "✗ Conversion failed!"
    exit 1
fi
EOF

# Make executable
chmod +x ~/tts.sh

# Usage
./tts.sh mytext.txt output.wav en-US-MichelleNeural
```

## Pydroid 3 Solution

Pydroid 3 is a full-featured Python IDE for Android with GUI support.

### Installation
1. Install **Pydroid 3** from Google Play Store
2. Open Pydroid 3 and go to Terminal

### Setup
```bash
# In Pydroid 3 terminal
pip install edge-tts aiohttp
```

### Python Script Example
```python
# tts_converter.py
import asyncio
import edge_tts
import sys
import os

async def convert_text_to_speech(text, output_file="output.wav", voice="en-US-MichelleNeural"):
    """Convert text to speech using edge-tts"""
    try:
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_file)
        print(f"Audio saved to: {os.path.abspath(output_file)}")
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python tts_converter.py <text> [output.wav] [voice]")
        text = input("Enter text to convert: ")
        output = "output.wav"
        voice = "en-US-MichelleNeural"
    else:
        text = sys.argv[1]
        output = sys.argv[2] if len(sys.argv) > 2 else "output.wav"
        voice = sys.argv[3] if len(sys.argv) > 3 else "en-US-MichelleNeural"

    # Run async function
    success = asyncio.run(convert_text_to_speech(text, output, voice))

    if success:
        print("Conversion successful!")
    else:
        print("Conversion failed.")

if __name__ == "__main__":
    main()
```

### GUI Application with Kivy in Pydroid
```python
# tts_app.py
from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.textinput import TextInput
from kivy.uix.label import Label
import asyncio
import edge_tts
import threading

class TTSEdgeApp(App):
    def build(self):
        layout = BoxLayout(orientation='vertical', padding=20, spacing=10)

        # Text input
        self.text_input = TextInput(
            hint_text='Enter text here...',
            size_hint_y=0.6,
            multiline=True
        )

        # Voice selection
        self.voice_input = TextInput(
            hint_text='Voice (default: en-US-MichelleNeural)',
            size_hint_y=0.1
        )

        # Convert button
        self.convert_btn = Button(
            text='Convert to Speech',
            size_hint_y=0.1,
            background_color=(0.2, 0.6, 0.8, 1)
        )
        self.convert_btn.bind(on_press=self.convert_text)

        # Status label
        self.status_label = Label(
            text='Ready to convert text to speech',
            size_hint_y=0.2
        )

        layout.add_widget(Label(text='Edge-TTS Converter', font_size=24))
        layout.add_widget(self.text_input)
        layout.add_widget(self.voice_input)
        layout.add_widget(self.convert_btn)
        layout.add_widget(self.status_label)

        return layout

    def convert_text(self, instance):
        text = self.text_input.text.strip()
        voice = self.voice_input.text.strip() or "en-US-MichelleNeural"

        if not text:
            self.status_label.text = 'Please enter some text'
            return

        self.status_label.text = 'Converting... Please wait'
        self.convert_btn.disabled = True

        # Run conversion in background thread
        threading.Thread(
            target=self.run_conversion,
            args=(text, voice)
        ).start()

    def run_conversion(self, text, voice):
        try:
            # Set up asyncio event loop
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            output_file = "/storage/emulated/0/edge_tts_output.wav"

            async def convert():
                communicate = edge_tts.Communicate(text, voice)
                await communicate.save(output_file)

            loop.run_until_complete(convert())
            loop.close()

            # Update UI on main thread
            self.status_label.text = f'Audio saved to:\n{output_file}'

        except Exception as e:
            self.status_label.text = f'Error: {str(e)}'
        finally:
            self.convert_btn.disabled = False

if __name__ == '__main__':
    TTSEdgeApp().run()
```

## APK Packaging Solutions

### Option 1: BeeWare (Python to Native APK)

BeeWare allows packaging Python apps as native Android APKs.

```bash
# Install BeeWare
pip install briefcase

# Create new project
briefcase new

# Configure pyproject.toml
# Add these dependencies:
# requires = [
#     "edge-tts>=6.0.0",
#     "aiohttp>=3.8.0",
#     "asyncio"
# ]

# Build for Android
briefcase create android
briefcase build android
briefcase package android
```

### Option 2: Kivy with Buildozer

Buildozer is a tool for packaging Kivy apps for Android.

1. **Install Buildozer dependencies**
   ```bash
   pip install buildozer cython
   ```

2. **Create Buildozer spec file** (`buildozer.spec`)
   ```ini
   [app]
   title = Edge-TTS Converter
   package.name = edgetts
   package.domain = org.edgetts

   source.dir = .
   source.include_exts = py,png,jpg,kv,atlas

   version = 1.0
   requirements = python3,kivy,edge-tts,aiohttp

   android.permissions = INTERNET,WRITE_EXTERNAL_STORAGE,READ_EXTERNAL_STORAGE

   [buildozer]
   log_level = 2
   ```

3. **Build APK**
   ```bash
   buildozer android debug
   ```

### Option 3: Chaquopy (Python in Android Studio)

Chaquopy allows running Python code in Android Studio projects.

1. **Add to build.gradle**:
   ```gradle
   apply plugin: 'com.chaquo.python'

   android {
       // ... other configurations
   }

   python {
       buildPython "/usr/bin/python3"

       pip {
           install "edge-tts==6.0.0"
           install "aiohttp==3.8.0"
       }
   }
   ```

2. **Call Python from Kotlin**:
   ```kotlin
   class TTSService(context: Context) {
       private val py = Python.getInstance()

       fun convertText(text: String): File {
           val edgeModule = py.getModule("edge_tts_wrapper")
           val result = edgeModule.callAttr("convert_text", text)
           return File(result.toString())
       }
   }
   ```

## Alternative Approaches

### Hybrid Solution: Android App + Python Microservice

Create an Android app that launches a local Python server:

```kotlin
// Android service to start Python server
class PythonTTSService : Service() {
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Extract Python scripts from assets
        // Start Python process with edge-tts server
        // Communicate via localhost HTTP API

        return START_STICKY
    }

    fun convertViaHTTP(text: String): File {
        // Send HTTP request to local Python server
        // Download resulting audio file
    }
}
```

### Edge-TTS REST API Server

Run edge-tts as a REST API server on Android:

```python
# tts_server.py
from fastapi import FastAPI, HTTPException
import edge_tts
import asyncio
import tempfile
import os

app = FastAPI()

@app.post("/convert")
async def convert_text(request: dict):
    text = request.get("text", "")
    voice = request.get("voice", "en-US-MichelleNeural")

    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    # Create temp file
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        output_path = tmp.name

    # Convert text to speech
    try:
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_path)

        return {
            "success": True,
            "file_path": output_path,
            "file_name": os.path.basename(output_path)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## Practical Considerations

### Network Requirements
- **Edge-TTS requires internet connection** (calls Microsoft services)
- No offline functionality available
- Consider fallback to Android's built-in TTS when offline

### Performance Factors
- **Voice quality**: High, but dependent on network
- **Conversion speed**: Varies with text length and network
- **Battery impact**: Network usage + processing

### Storage Permissions
Required Android permissions:
```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### Solution Comparison

| Solution | Difficulty | User Experience | Maintenance | Recommendation |
|----------|------------|-----------------|-------------|----------------|
| **Termux** | ★☆☆☆☆ | ★★☆☆☆ | ★★☆☆☆ | ★★★★★ |
| **Pydroid 3** | ★★☆☆☆ | ★★★☆☆ | ★★☆☆☆ | ★★★★☆ |
| **Kivy + Buildozer** | ★★★☆☆ | ★★★★☆ | ★★★☆☆ | ★★★☆☆ |
| **BeeWare** | ★★★★☆ | ★★★★☆ | ★★★★☆ | ★★☆☆☆ |
| **Android Native** | ★★★★★ | ★★★★★ | ★★★☆☆ | ★☆☆☆☆ |

## Troubleshooting

### Common Issues

#### 1. Network Connection Errors
```bash
# Test connectivity
ping google.com

# Check if edge-tts can reach Microsoft servers
curl -I https://speech.platform.bing.com

# Set proxy if needed
export HTTPS_PROXY="http://your-proxy:port"
```

#### 2. Storage Permission Issues
```bash
# In Termux
termux-setup-storage  # Re-run setup

# Check if storage is accessible
ls /storage/emulated/0/

# Create directory if needed
mkdir -p /storage/emulated/0/EdgeTTS
```

#### 3. Python Dependency Conflicts
```bash
# Use virtual environment
python -m venv edge-tts-env
source edge-tts-env/bin/activate

# Reinstall with specific versions
pip install edge-tts==6.0.0
pip install aiohttp==3.8.0
```

#### 4. Missing Dependencies
```bash
# Install required system packages
pkg install python rust binutils

# For audio playback
pkg install mpv vlc
```

#### 5. Large File Processing
```python
# Split long texts
def split_text(text, max_length=5000):
    """Split text into chunks"""
    words = text.split()
    chunks = []
    current_chunk = []

    for word in words:
        if len(' '.join(current_chunk + [word])) <= max_length:
            current_chunk.append(word)
        else:
            chunks.append(' '.join(current_chunk))
            current_chunk = [word]

    if current_chunk:
        chunks.append(' '.join(current_chunk))

    return chunks

# Process chunks and merge
async def convert_long_text(text, output_file):
    chunks = split_text(text)
    temp_files = []

    for i, chunk in enumerate(chunks):
        temp_file = f"temp_{i}.wav"
        communicate = edge_tts.Communicate(chunk, "en-US-MichelleNeural")
        await communicate.save(temp_file)
        temp_files.append(temp_file)

    # Merge audio files (requires ffmpeg)
    # ffmpeg -i "concat:temp_0.wav|temp_1.wav" -acodec copy output.wav
```

## Performance Optimization

### 1. Caching Mechanism
```python
import hashlib
import os

class TTSCache:
    def __init__(self, cache_dir="/sdcard/edge_tts_cache"):
        self.cache_dir = cache_dir
        os.makedirs(cache_dir, exist_ok=True)

    def get_cache_key(self, text, voice):
        """Generate unique key for text + voice combination"""
        key_str = f"{text}|{voice}"
        return hashlib.md5(key_str.encode()).hexdigest()

    def get_cached_file(self, text, voice):
        """Return cached file if exists"""
        key = self.get_cache_key(text, voice)
        cached_path = os.path.join(self.cache_dir, f"{key}.wav")

        if os.path.exists(cached_path):
            return cached_path
        return None

    def save_to_cache(self, text, voice, audio_file):
        """Save converted audio to cache"""
        key = self.get_cache_key(text, voice)
        cached_path = os.path.join(self.cache_dir, f"{key}.wav")

        import shutil
        shutil.copy2(audio_file, cached_path)
        return cached_path
```

### 2. Background Processing
```python
# Use Android WorkManager or foreground service
# to handle long conversions without blocking UI
```

### 3. Batch Processing
```python
async def batch_convert(texts, output_dir, voice="en-US-MichelleNeural"):
    """Convert multiple texts efficiently"""
    import aiohttp
    import asyncio

    semaphore = asyncio.Semaphore(3)  # Limit concurrent connections

    async def convert_one(text, filename):
        async with semaphore:
            output_path = os.path.join(output_dir, filename)
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(output_path)
            return output_path

    tasks = [convert_one(text, f"output_{i}.wav")
             for i, text in enumerate(texts)]

    return await asyncio.gather(*tasks, return_exceptions=True)
```

### 4. Network Optimization
```python
# Implement retry logic with exponential backoff
async def convert_with_retry(text, output_file, max_retries=3):
    for attempt in range(max_retries):
        try:
            communicate = edge_tts.Communicate(text, "en-US-MichelleNeural")
            await communicate.save(output_file)
            return True
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(2 ** attempt)  # Exponential backoff

    return False
```

## Complete Project Structure

For a production-ready Android implementation:

```
edge-tts-android-project/
├── android-app/              # Native Android app
│   ├── app/
│   │   ├── src/main/java/com/edgetts/
│   │   │   ├── MainActivity.kt
│   │   │   ├── TTSService.kt
│   │   │   ├── FileUtils.kt
│   │   │   └── NetworkUtils.kt
│   │   └── build.gradle
│   └── gradle.properties
├── python-backend/           # Python edge-tts integration
│   ├── tts_server.py        # REST API server
│   ├── edge_wrapper.py      # edge-tts wrapper with caching
│   ├── requirements.txt
│   └── startup.sh           # Startup script for Termux
├── termux-scripts/          # Standalone Termux solution
│   ├── install.sh
│   ├── tts-command.sh
│   └── uninstall.sh
├── assets/                  # Sample files and resources
│   ├── sample_texts/
│   └── voices_list.json
└── docs/                    # Documentation
    ├── INSTALL.md
    ├── API_REFERENCE.md
    └── TROUBLESHOOTING.md
```

## Quick Reference Commands

### Termux Commands
```bash
# Install everything
pkg update && pkg upgrade
pkg install python python-pip git ffmpeg mpv
pip install edge-tts

# Quick conversion
echo "Your text here" > input.txt
edge-tts -f input.txt -o output.wav -v en-US-MichelleNeural
mpv output.wav

# List available voices
edge-tts --list-voices | grep en-US
```

### Python One-liners
```python
# In Pydroid 3 or Termux Python
import asyncio, edge_tts
asyncio.run(edge_tts.Communicate("Hello Android", "en-US-MichelleNeural").save("hello.wav"))
```

## Conclusion

The best approach depends on your needs:

- **For quick testing**: Use Termux with simple scripts
- **For GUI applications**: Use Pydroid 3 with Kivy
- **For production apps**: Consider Kivy + Buildozer or Android native with Python integration
- **For maximum performance**: Android native app with edge-tss REST API server

All solutions require an active internet connection as edge-tts relies on Microsoft's cloud services. For offline functionality, consider integrating Android's built-in TTS engine as a fallback.

---

*Last Updated: 2026-03-08*
*Document Version: 2.0*
*Tested On: Android 9+, Termux 0.118, Python 3.9+*