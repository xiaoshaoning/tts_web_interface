# Android App Migration Plan

## Overview
This document outlines the migration strategy for converting the Edge-TTS Web Interface project into a native Android application. The plan maintains core functionality while leveraging Android platform capabilities.

## 1. Technology Stack Recommendations

### Option A: Native Android Development (Recommended)
- **Language**: Kotlin (Modern Android development standard)
- **TTS Engine**: Android built-in `TextToSpeech` API + optional cloud service integration
- **Architecture Pattern**: MVVM + Repository pattern
- **UI Framework**: Jetpack Compose (Modern) or XML layouts
- **Advantages**: Best performance, full Android ecosystem support, offline capabilities

### Option B: Cross-Platform Development
- **Framework**: React Native (reuse some JS code) or Flutter
- **TTS**: Bridge to Android TTS API via native modules
- **Advantages**: Cross-platform, web skill reuse

## 2. Feature Mapping & Architecture Design

### Core Feature Correspondence
| Web Feature | Android Implementation |
|-------------|-----------------------|
| Express Server | Local Service/WorkManager |
| edge-tts command line | Android TextToSpeech API |
| File Upload | Android File Picker + Storage Access |
| Web Frontend | Android Native UI (Jetpack Compose/XML) |
| Audio Playback | MediaPlayer/ExoPlayer |
| Audio Saving | Android MediaStore/File System |
| Batch Scripts | Android Services/Workers |

### Proposed Architecture
```
Android App (Kotlin)
├── Presentation Layer (UI)
│   ├── MainActivity (Main Interface)
│   ├── FilePickerFragment (File Selection)
│   ├── VoiceSelectionFragment (Voice Selection)
│   └── PlayerFragment (Audio Playback)
├── Domain Layer (Business Logic)
│   ├── TTSConverter (TTS Conversion Service)
│   ├── FileProcessor (File Processing)
│   └── AudioManager (Audio Management)
├── Data Layer (Data Storage)
│   ├── LocalRepository (Local Storage)
│   └── SettingsRepository (User Settings)
└── External Services
    ├── Android TTS Engine
    └── (Optional) Cloud TTS API (Google, Azure, etc.)
```

## 3. Detailed Implementation Steps

### Phase 1: Environment Setup & Foundation
1. **Android Studio Installation**: Configure Kotlin development environment
2. **Project Initialization**: Create new Android project, minimum API level 21+
3. **Permission Configuration**: Add necessary permissions in AndroidManifest.xml
   ```xml
   <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
   <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
   <uses-permission android:name="android.permission.INTERNET" /> <!-- For cloud services -->
   ```

### Phase 2: Core TTS Functionality
```kotlin
// TTS Service Wrapper
class TTSService(context: Context) {
    private var tts: TextToSpeech? = null
    private var onInitListener: OnInitListener

    init {
        tts = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                // Set language and voice parameters
                tts?.language = Locale.US
                tts?.setSpeechRate(1.0f)
                tts?.setPitch(1.0f)
            }
        }
    }

    fun convertTextToSpeech(text: String, fileName: String): File {
        // Generate audio file
        val outputFile = File(context.getExternalFilesDir("audio"), "$fileName.wav")
        // Android TTS supports direct file saving
        val params = Bundle().apply {
            putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, fileName)
        }
        tts?.synthesizeToFile(text, params, outputFile, fileName)
        return outputFile
    }

    fun getAvailableVoices(): List<Voice> {
        return tts?.voices?.filter { it.locale.language.startsWith("en") } ?: emptyList()
    }
}
```

### Phase 3: File Processing Module
```kotlin
class FileProcessor(private val context: Context) {
    // Supported file types
    private val supportedMimeTypes = arrayOf(
        "text/plain",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

    // Use DocumentFile API for file handling (compatible with all Android versions)
    fun processFile(uri: Uri): String {
        return when {
            uri.toString().endsWith(".txt") -> readTextFile(uri)
            uri.toString().endsWith(".pdf") -> extractTextFromPDF(uri)
            else -> extractTextFromDoc(uri)
        }
    }

    private fun readTextFile(uri: Uri): String {
        return context.contentResolver.openInputStream(uri)?.use {
            it.bufferedReader().readText()
        } ?: ""
    }
}
```

### Phase 4: User Interface Development
```kotlin
// Build modern UI with Jetpack Compose
@Composable
fun MainScreen(viewModel: MainViewModel) {
    Column(modifier = Modifier.padding(16.dp)) {
        // File selection area
        FileUploadArea(onFileSelected = { uri ->
            viewModel.processFile(uri)
        })

        // Voice selection
        VoiceSelection(
            voices = viewModel.availableVoices,
            selectedVoice = viewModel.selectedVoice,
            onVoiceSelected = { voice ->
                viewModel.selectVoice(voice)
            }
        )

        // Convert button
        Button(
            onClick = { viewModel.convertToSpeech() },
            enabled = viewModel.isFileSelected
        ) {
            Text("Convert to Speech")
        }

        // Audio player
        if (viewModel.audioFile != null) {
            AudioPlayer(
                audioFile = viewModel.audioFile,
                onPlay = { viewModel.playAudio() },
                onPause = { viewModel.pauseAudio() },
                onDownload = { viewModel.saveAudio() }
            )
        }
    }
}
```

### Phase 5: Audio Playback & Management
```kotlin
class AudioPlayerService : Service() {
    private var mediaPlayer: MediaPlayer? = null

    fun playAudio(file: File) {
        mediaPlayer?.release()
        mediaPlayer = MediaPlayer().apply {
            setDataSource(file.path)
            prepare()
            start()
        }
    }

    fun saveToDownloads(file: File) {
        val contentValues = ContentValues().apply {
            put(MediaStore.Audio.Media.DISPLAY_NAME, file.name)
            put(MediaStore.Audio.Media.MIME_TYPE, "audio/wav")
            put(MediaStore.Audio.Media.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
        }

        val resolver = context.contentResolver
        val uri = resolver.insert(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, contentValues)
        uri?.let {
            resolver.openOutputStream(it)?.use { outputStream ->
                file.inputStream().copyTo(outputStream)
            }
        }
    }
}
```

## 4. Enhanced Features

### 4.1 Multi-Engine Support
```kotlin
// Abstract TTS engine interface
interface TTSEngine {
    suspend fun synthesize(text: String, voice: Voice): File
    fun getAvailableVoices(): List<Voice>
    fun isAvailable(): Boolean
}

// Implement different engines
class AndroidTTSEngine(context: Context) : TTSEngine { /* Android built-in TTS */ }
class GoogleCloudTTSEngine(apiKey: String) : TTSEngine { /* Google Cloud TTS */ }
class AzureTTSEngine(subscriptionKey: String) : TTSEngine { /* Azure Cognitive Services */ }
```

### 4.2 Batch Processing & Queue
```kotlin
class BatchProcessor {
    private val workManager = WorkManager.getInstance(context)

    fun processMultipleFiles(files: List<Uri>) {
        files.forEach { uri ->
            val workRequest = OneTimeWorkRequestBuilder<TTSWorker>()
                .setInputData(workDataOf("file_uri" to uri.toString()))
                .setConstraints(
                    Constraints.Builder()
                        .setRequiredNetworkType(NetworkType.CONNECTED) // For cloud services
                        .build()
                )
                .build()
            workManager.enqueue(workRequest)
        }
    }
}
```

### 4.3 Settings & Customization
- Voice rate and pitch adjustment
- Output format selection (WAV, MP3)
- Auto-cleanup of old files
- Theme switching (dark/light mode)

## 5. Potential Challenges & Solutions

### Challenge 1: Voice Quality Differences
- **Problem**: Android built-in TTS quality may not match edge-tts
- **Solutions**:
  - Integrate high-quality cloud TTS services (Google Cloud TTS, Azure TTS)
  - Provide voice preview functionality
  - Allow installation of third-party TTS engines (e.g., Google TTS)

### Challenge 2: Large File Processing
- **Problem**: Long texts may exceed TTS engine limits
- **Solutions**:
  - Automatically split long texts
  - Process in chunks and merge audio
  - Show processing progress

### Challenge 3: Offline Support
- **Problem**: Cloud services require network connection
- **Solutions**:
  - Default to Android built-in TTS (offline)
  - Provide "Download high-quality voices over Wi-Fi only" option
  - Cache frequently used voices

## 6. Development Roadmap

### Weeks 1-2: Foundation
- Android project setup
- Basic TTS conversion functionality
- File picker implementation

### Weeks 3-4: Core Features
- Audio player development
- File save functionality
- Settings interface

### Weeks 5-6: Enhanced Features
- Multi-TTS engine support
- Batch processing
- UI optimization

### Weeks 7-8: Testing & Release
- Unit tests & UI tests
- Performance optimization
- Google Play Store preparation

## 7. Resources & Tools

### Learning Resources
- [Android Developers Official Documentation](https://developer.android.com/)
- [Kotlin Official Tutorial](https://kotlinlang.org/docs/android-overview.html)
- [Jetpack Compose Tutorial](https://developer.android.com/jetpack/compose)

### Development Tools
- Android Studio Arctic Fox+
- Firebase (Crash reporting, Analytics)
- GitHub Actions (CI/CD)

### Testing Devices
- Physical Android devices (API 21+)
- Android emulators (multiple versions)

## 8. Maintenance & Evolution

1. **Regular Updates**: Follow Android new version features
2. **User Feedback**: Integrate in-app feedback system
3. **Analytics**: Use Firebase Analytics to understand usage patterns
4. **Community Building**: Create GitHub repository for contributions

## 9. Success Metrics

### Technical Metrics
- App stability (crash-free rate > 99%)
- Conversion speed (< 10 seconds for 1MB text)
- Battery impact (minimal battery consumption)
- Storage efficiency (optimized audio file sizes)

### User Metrics
- Daily active users
- Conversion completion rate
- User retention rate
- App store ratings

## 10. Risk Mitigation

### Technical Risks
- **Risk**: TTS engine compatibility issues
- **Mitigation**: Fallback to Android default TTS, extensive testing

### Market Risks
- **Risk**: Competition from existing TTS apps
- **Mitigation**: Focus on file format support and batch processing

### Resource Risks
- **Risk**: Development time exceeds estimates
- **Mitigation**: Prioritize MVP features, agile development approach

---

*Last Updated: 2026-03-07*
*Document Version: 1.0*
*Status: Planning Phase*