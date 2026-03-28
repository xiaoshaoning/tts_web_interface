// Edge-TTS Web Application
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const convertBtn = document.getElementById('convert-btn');
    const clearBtn = document.getElementById('clear-btn');
    const fileInfo = document.getElementById('file-info');
    const resultsContent = document.getElementById('results-content');
    const loadingOverlay = document.getElementById('loading-overlay');
    const themeToggle = document.getElementById('theme-toggle');
    const voiceOptions = document.querySelectorAll('.voice-option');

    // State
    let selectedFile = null;
    let selectedVoice = '';
    let currentAudio = null;
    let audioPlayer = null;

    // Initialize
    initEventListeners();
    updateVoiceSelection();

    // Event Listeners
    function initEventListeners() {
        // File input change
        fileInput.addEventListener('change', handleFileSelect);

        // Upload area click
        uploadArea.addEventListener('click', (event) => {
            // If the click is already on the file input, don't trigger another click
            if (event.target === fileInput || fileInput.contains(event.target)) {
                return;
            }
            fileInput.click();
        });

        // Drag and drop events
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);

        // Convert button
        convertBtn.addEventListener('click', handleConvert);

        // Clear button
        clearBtn.addEventListener('click', handleClear);

        // Voice selection
        voiceOptions.forEach(option => {
            option.addEventListener('click', () => {
                selectedVoice = option.dataset.voice;
                updateVoiceSelection();
            });
        });

        // Theme toggle
        themeToggle.addEventListener('click', toggleTheme);
    }

    // File Selection Handler
    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            processFile(file);
        }
    }

    // Drag and Drop Handlers
    function handleDragOver(event) {
        event.preventDefault();
        uploadArea.classList.add('dragover');
    }

    function handleDragLeave(event) {
        event.preventDefault();
        uploadArea.classList.remove('dragover');
    }

    function handleDrop(event) {
        event.preventDefault();
        uploadArea.classList.remove('dragover');

        const files = event.dataTransfer.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    }

    // Process selected file
    function processFile(file) {
        // Validate file
        if (!validateFile(file)) {
            showError('Please select a valid text file (TXT, DOC, DOCX, PDF) under 10MB');
            return;
        }

        selectedFile = file;
        displayFileInfo(file);

        // Enable convert button
        convertBtn.disabled = false;
        convertBtn.classList.remove('btn-outline');
        convertBtn.classList.add('btn-primary');
    }

    // Validate file
    function validateFile(file) {
        const validTypes = ['text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf'];
        const validExtensions = ['.txt', '.text', '.doc', '.docx', '.pdf'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        // Check size
        if (file.size > maxSize) {
            return false;
        }

        // Check type
        if (validTypes.includes(file.type)) {
            return true;
        }

        // Check extension as fallback
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        return validExtensions.includes(extension);
    }

    // Display file information
    function displayFileInfo(file) {
        const fileSize = formatFileSize(file.size);
        const fileType = file.type || 'Unknown';
        const fileName = file.name;

        // Read file content for preview (for text files)
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            const preview = content.length > 500 ? content.substring(0, 500) + '...' : content;

            fileInfo.innerHTML = `
                <div class="file-selected">
                    <div class="file-header">
                        <div class="file-icon">
                            <i class="fas fa-file-alt"></i>
                        </div>
                        <div class="file-details">
                            <h4>${fileName}</h4>
                            <div class="file-meta">
                                <span>${fileSize}</span>
                                <span>${fileType}</span>
                                <span>Uploaded</span>
                            </div>
                        </div>
                    </div>
                    <div class="file-preview">
                        <pre>${escapeHtml(preview)}</pre>
                    </div>
                </div>
            `;
        };

        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            reader.readAsText(file);
        } else {
            // For non-text files, just show basic info
            fileInfo.innerHTML = `
                <div class="file-selected">
                    <div class="file-header">
                        <div class="file-icon">
                            <i class="fas fa-file-alt"></i>
                        </div>
                        <div class="file-details">
                            <h4>${fileName}</h4>
                            <div class="file-meta">
                                <span>${fileSize}</span>
                                <span>${fileType}</span>
                                <span>Uploaded</span>
                            </div>
                        </div>
                    </div>
                    <div class="file-preview">
                        <p>Preview not available for this file type. The file will be processed as text.</p>
                    </div>
                </div>
            `;
        }
    }

    // Convert file to speech
    async function handleConvert() {
        if (!selectedFile) {
            showError('Please select a file first');
            return;
        }

        showLoading();

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('voice', selectedVoice);

            const response = await fetch('/convert', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                displayAudioResult(result);
                showSuccess('File converted successfully!');
            } else {
                throw new Error(result.error || result.details || 'Conversion failed');
            }
        } catch (error) {
            showError(`Conversion failed: ${error.message}`);
        } finally {
            hideLoading();
        }
    }

    // Display audio result
    function displayAudioResult(result) {
        const audioUrl = result.audioUrl;
        const fileName = result.fileName;

        resultsContent.innerHTML = `
            <div class="audio-player">
                <div class="audio-header">
                    <div class="audio-title">
                        <i class="fas fa-music"></i>
                        <h4>${fileName}</h4>
                    </div>
                    <div class="audio-status">
                        <span class="tag" style="background-color: var(--accent-color); color: white;">
                            <i class="fas fa-check-circle"></i> Ready
                        </span>
                    </div>
                </div>

                <div class="audio-controls">
                    <button class="control-btn" id="play-btn">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="control-btn" id="pause-btn">
                        <i class="fas fa-pause"></i>
                    </button>
                    <button class="control-btn" id="stop-btn">
                        <i class="fas fa-stop"></i>
                    </button>
                </div>

                <div class="audio-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-fill"></div>
                    </div>
                    <div class="progress-time">
                        <span id="current-time">0:00</span>
                        <span id="duration">0:00</span>
                    </div>
                </div>

                <div class="audio-volume">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 1rem;">
                        <i class="fas fa-volume-up"></i>
                        <input type="range" id="volume-slider" min="0" max="100" value="100" style="width: 100%;">
                    </div>
                </div>

                <a href="${audioUrl}" download="${fileName}" class="audio-download">
                    <i class="fas fa-download"></i> Download Audio
                </a>
            </div>
        `;

        // Initialize audio player (use setTimeout to ensure DOM is updated)
        setTimeout(() => initAudioPlayer(audioUrl), 0);
    }

    // Initialize audio player
    function initAudioPlayer(audioUrl) {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }

        currentAudio = new Audio(audioUrl);
        currentAudio.preload = 'auto';
        audioPlayer = {
            audio: currentAudio,
            isPlaying: false,
            progressFill: document.getElementById('progress-fill'),
            currentTimeEl: document.getElementById('current-time'),
            durationEl: document.getElementById('duration'),
            playBtn: document.getElementById('play-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            stopBtn: document.getElementById('stop-btn'),
            volumeSlider: document.getElementById('volume-slider')
        };

        // Validate audio player elements
        const requiredElements = ['progressFill', 'currentTimeEl', 'durationEl', 'playBtn', 'pauseBtn', 'stopBtn', 'volumeSlider'];
        let missingElements = [];
        requiredElements.forEach(key => {
            if (!audioPlayer[key]) {
                missingElements.push(key);
            }
        });

        if (missingElements.length > 0) {
            console.error('Missing audio player elements:', missingElements);
            return;
        }

        // Audio event listeners
        currentAudio.addEventListener('loadedmetadata', () => {
            audioPlayer.durationEl.textContent = formatTime(currentAudio.duration);
        });

        currentAudio.addEventListener('timeupdate', () => {
            if (!currentAudio.duration) return;

            const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
            audioPlayer.progressFill.style.width = `${progress}%`;
            audioPlayer.currentTimeEl.textContent = formatTime(currentAudio.currentTime);
        });

        currentAudio.addEventListener('ended', () => {
            audioPlayer.isPlaying = false;
            updatePlayPauseButtons();
        });

        // Control buttons
        audioPlayer.playBtn.addEventListener('click', () => {
            if (audioPlayer.isPlaying) {
                currentAudio.pause();
            } else {
                currentAudio.play();
            }
            audioPlayer.isPlaying = !audioPlayer.isPlaying;
            updatePlayPauseButtons();
        });

        audioPlayer.pauseBtn.addEventListener('click', () => {
            currentAudio.pause();
            audioPlayer.isPlaying = false;
            updatePlayPauseButtons();
        });

        audioPlayer.stopBtn.addEventListener('click', () => {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            audioPlayer.isPlaying = false;
            updatePlayPauseButtons();
        });

        // Volume control
        audioPlayer.volumeSlider.addEventListener('input', (e) => {
            currentAudio.volume = e.target.value / 100;
        });

        // Progress bar click
        const progressBar = document.querySelector('.audio-progress .progress-bar');
        if (progressBar) {
            progressBar.addEventListener('click', (e) => {
                const rect = progressBar.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                currentAudio.currentTime = pos * currentAudio.duration;
            });
        }

        // Initialize buttons
        updatePlayPauseButtons();
    }

    // Update play/pause buttons
    function updatePlayPauseButtons() {
        if (!audioPlayer) return;

        if (audioPlayer.isPlaying) {
            audioPlayer.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            audioPlayer.playBtn.style.backgroundColor = 'var(--warning-color)';
        } else {
            audioPlayer.playBtn.innerHTML = '<i class="fas fa-play"></i>';
            audioPlayer.playBtn.style.backgroundColor = '';
        }
    }

    // Clear all
    function handleClear() {
        selectedFile = null;
        fileInput.value = '';
        fileInfo.innerHTML = `
            <div class="no-file">
                <i class="fas fa-file-import"></i>
                <p>No file selected</p>
            </div>
        `;

        resultsContent.innerHTML = `
            <div class="no-results">
                <i class="fas fa-headphones"></i>
                <p>Your audio will appear here after conversion</p>
            </div>
        `;

        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
            audioPlayer = null;
        }

        // Reset convert button
        convertBtn.disabled = true;
        convertBtn.classList.remove('btn-primary');
        convertBtn.classList.add('btn-outline');
    }

    // Update voice selection UI
    function updateVoiceSelection() {
        voiceOptions.forEach(option => {
            if (option.dataset.voice === selectedVoice) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }

    // Theme toggle
    function toggleTheme() {
        const icon = themeToggle.querySelector('i');
        if (icon.classList.contains('fa-moon')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            document.documentElement.removeAttribute('data-theme');
        }
    }

    // Loading overlay
    function showLoading() {
        loadingOverlay.style.display = 'flex';
    }

    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }

    // Notification functions
    function showError(message) {
        showNotification(message, 'error');
    }

    function showSuccess(message) {
        showNotification(message, 'success');
    }

    function showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background-color: var(--bg-card);
                border: 1px solid var(--border-color);
                border-left: 4px solid ${type === 'error' ? 'var(--danger-color)' : 'var(--accent-color)'};
                border-radius: var(--border-radius-sm);
                padding: 1rem 1.5rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
                box-shadow: var(--shadow-lg);
                z-index: 10000;
                animation: slideIn 0.3s ease;
                max-width: 400px;
            }

            .notification.error {
                border-left-color: var(--danger-color);
            }

            .notification.success {
                border-left-color: var(--accent-color);
            }

            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }

            .notification-content i {
                font-size: 1.25rem;
                color: ${type === 'error' ? 'var(--danger-color)' : 'var(--accent-color)'};
            }

            .notification-close {
                background: none;
                border: none;
                color: var(--text-muted);
                cursor: pointer;
                font-size: 1rem;
                padding: 0.25rem;
                border-radius: 4px;
            }

            .notification-close:hover {
                background-color: var(--bg-light);
                color: var(--text-primary);
            }

            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;

        // Add to document
        document.head.appendChild(style);
        document.body.appendChild(notification);

        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                notification.remove();
                style.remove();
            }, 300);
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    notification.remove();
                    style.remove();
                }, 300);
            }
        }, 5000);
    }

    // Utility functions
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});