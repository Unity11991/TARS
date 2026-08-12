import { AgentState, VoiceConfig, DEFAULT_VOICE_CONFIG } from '../../types/index';

export interface VoiceEngineCallbacks {
  onStateChange: (state: AgentState) => void;
  onInterimTranscript: (text: string) => void;
  onFinalTranscript: (text: string) => void;
  onMicAmplitude: (amplitude: number) => void;
  onError: (error: string) => void;
}

export class VoiceEngine {
  private state: AgentState = 'idle';
  private callbacks: VoiceEngineCallbacks;
  private voiceConfig: VoiceConfig = { ...DEFAULT_VOICE_CONFIG };

  // Web Audio API
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private animFrameId: number | null = null;

  // Speech Recognition
  private recognition: any = null;
  private isRecognitionActive = false;

  // Silence Detection & Echo Prevention
  private silenceTimer: any = null;
  private accumulatedInterimText: string = '';
  private isPostTtsCooldown = false;
  private postTtsCooldownTimer: any = null;
  private recentAiSpokenTexts: string[] = [];

  // Speech Synthesis Queue & Stream State
  private ttsQueue: string[] = [];
  private isSpeaking = false;
  private isStreamingResponse = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private streamGraceTimer: any = null;

  constructor(callbacks: VoiceEngineCallbacks) {
    this.callbacks = callbacks;
    this.initSpeechRecognition();
  }

  public updateConfig(config: Partial<VoiceConfig>) {
    this.voiceConfig = { ...this.voiceConfig, ...config };
  }

  public getState(): AgentState {
    return this.state;
  }

  private setState(newState: AgentState) {
    if (this.state === newState) return;
    this.state = newState;

    // If state changes to speaking or processing, immediately stop Speech Recognition to prevent echo
    if (newState === 'speaking' || newState === 'processing') {
      this.stopSpeechRecognitionInternal();
    }

    this.callbacks.onStateChange(newState);
  }

  public setStreaming(isStreaming: boolean) {
    this.isStreamingResponse = isStreaming;
    if (isStreaming) {
      this.stopSpeechRecognitionInternal();
    } else {
      if (this.streamGraceTimer) {
        clearTimeout(this.streamGraceTimer);
        this.streamGraceTimer = null;
      }
      // If stream ended and no sentence is currently playing/queued, transition state
      if (!this.isSpeaking && this.ttsQueue.length === 0) {
        this.finishTtsSession();
      }
    }
  }

  /* ==========================================
     MICROPHONE & AUDIO ANALYSIS
     ========================================== */
  public async initMicrophone(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser audio recording not supported');
      }

      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioCtx.createMediaStreamSource(this.micStream);

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      this.startAmplitudeLoop();
      return true;
    } catch (err: any) {
      console.error('[VoiceEngine] Mic Init Error:', err);
      this.callbacks.onError(err.message || 'Microphone access denied');
      this.setState('error');
      return false;
    }
  }

  private startAmplitudeLoop() {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const loop = () => {
      if (!this.analyser) return;
      this.analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const normalizedAmp = Math.min(100, Math.round((rms / 128) * 100));

      this.callbacks.onMicAmplitude(normalizedAmp);

      this.animFrameId = requestAnimationFrame(loop);
    };

    loop();
  }

  /* ==========================================
     SILENCE DETECTION & AUTO-SUBMISSION
     ========================================== */
  private resetSilenceTimer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.accumulatedInterimText.trim() && !this.isSpeaking && !this.isPostTtsCooldown) {
      // Set 1.2s silence timer: if user stops talking for 1.2 seconds, auto-submit message
      this.silenceTimer = setTimeout(() => {
        this.flushSpeechSubmission();
      }, 1200);
    }
  }

  private flushSpeechSubmission() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    const textToSend = this.accumulatedInterimText.trim();
    if (textToSend && (this.state === 'listening' || this.state === 'idle') && !this.isSpeaking && !this.isPostTtsCooldown) {
      // Check if text matches AI's own recent spoken sentences (echo filter)
      if (this.isEchoOfAiSpeech(textToSend)) {
        console.log('[VoiceEngine] Echo filter caught AI self-talk, ignoring:', textToSend);
        this.accumulatedInterimText = '';
        this.callbacks.onInterimTranscript('');
        return;
      }

      console.log('[VoiceEngine] Silence auto-submit triggered for:', textToSend);
      this.accumulatedInterimText = '';
      this.callbacks.onInterimTranscript('');
      this.stopSpeechRecognitionInternal();
      this.callbacks.onFinalTranscript(textToSend);
      this.setState('processing');
    }
  }

  private isEchoOfAiSpeech(userText: string): boolean {
    const cleanUser = userText.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    if (!cleanUser) return true;

    for (const aiText of this.recentAiSpokenTexts) {
      const cleanAi = aiText.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
      if (cleanAi && (cleanUser.includes(cleanAi) || cleanAi.includes(cleanUser))) {
        return true;
      }
    }
    return false;
  }

  /* ==========================================
     SPEECH RECOGNITION (STT)
     ========================================== */
  private initSpeechRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('[VoiceEngine] Web SpeechRecognition API not supported in this browser.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isRecognitionActive = true;
      if (this.state !== 'speaking' && this.state !== 'processing' && !this.isPostTtsCooldown) {
        this.setState('listening');
      }
    };

    this.recognition.onresult = (event: any) => {
      // Complete suppression while AI is speaking, processing, or in post-TTS cooldown
      if (this.state === 'speaking' || this.state === 'processing' || this.isSpeaking || this.isPostTtsCooldown) {
        return;
      }

      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript.trim()) {
        const text = finalTranscript.trim();
        if (this.isEchoOfAiSpeech(text)) {
          console.log('[VoiceEngine] Echo filter caught AI self-talk in final transcript, ignoring:', text);
          return;
        }

        if (this.silenceTimer) clearTimeout(this.silenceTimer);
        this.accumulatedInterimText = '';
        this.callbacks.onInterimTranscript('');
        this.stopSpeechRecognitionInternal();
        this.callbacks.onFinalTranscript(text);
        this.setState('processing');
        return;
      }

      if (interimTranscript.trim()) {
        if (this.isEchoOfAiSpeech(interimTranscript.trim())) {
          return;
        }
        this.accumulatedInterimText = interimTranscript;
        this.callbacks.onInterimTranscript(interimTranscript);
        this.resetSilenceTimer();
      }
    };

    this.recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('[VoiceEngine STT Notice]', event.error);
        this.callbacks.onError(`Speech recognition notice: ${event.error}`);
      }
    };

    this.recognition.onend = () => {
      this.isRecognitionActive = false;

      // If recognition ended during speaking or cooldown, do not restart!
      if (this.state === 'speaking' || this.state === 'processing' || this.isSpeaking || this.isPostTtsCooldown) {
        return;
      }

      if (this.accumulatedInterimText.trim() && (this.state === 'listening' || this.state === 'idle')) {
        this.flushSpeechSubmission();
        return;
      }

      // Auto-restart recognition only if autoListen is enabled and state is listening
      if (this.voiceConfig.autoListen && (this.state === 'listening' || this.state === 'idle')) {
        try {
          this.recognition.start();
        } catch (e) {
          // ignore
        }
      }
    };
  }

  private stopSpeechRecognitionInternal() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    this.accumulatedInterimText = '';
    this.callbacks.onInterimTranscript('');

    if (this.recognition && this.isRecognitionActive) {
      try {
        this.recognition.abort();
      } catch (e) {
        // ignore
      }
    }
    this.isRecognitionActive = false;
  }

  private startSpeechRecognitionInternal() {
    if (this.state === 'speaking' || this.state === 'processing' || this.isSpeaking || this.isPostTtsCooldown) {
      return;
    }

    if (this.recognition && !this.isRecognitionActive) {
      try {
        this.recognition.start();
      } catch (e) {
        // ignore
      }
    }
  }

  public async startListening() {
    if (!this.micStream) {
      const ok = await this.initMicrophone();
      if (!ok) return;
    }

    this.interrupt();
    this.accumulatedInterimText = '';
    this.setState('listening');
    this.startSpeechRecognitionInternal();
  }

  public stopListening() {
    this.stopSpeechRecognitionInternal();
    if (this.state === 'listening') {
      this.setState('idle');
    }
  }

  /* ==========================================
     TEXT-TO-SPEECH (TTS) & QUEUEING
     ========================================== */
  public enqueueSentence(sentence: string) {
    if (!sentence || !sentence.trim()) return;
    const trimmed = sentence.trim();
    this.ttsQueue.push(trimmed);

    // Track AI spoken sentences to prevent self-echo
    this.recentAiSpokenTexts.push(trimmed);
    if (this.recentAiSpokenTexts.length > 10) {
      this.recentAiSpokenTexts.shift();
    }

    // Immediately halt microphone recognition so speakers don't feed into STT
    this.stopSpeechRecognitionInternal();

    if (!this.isSpeaking || !this.currentUtterance) {
      this.processTTSQueue();
    }
  }

  private processTTSQueue() {
    if (this.streamGraceTimer) {
      clearTimeout(this.streamGraceTimer);
      this.streamGraceTimer = null;
    }

    if (this.ttsQueue.length === 0) {
      if (this.isStreamingResponse) {
        // If stream is still active, wait up to 3 seconds for next sentence
        this.streamGraceTimer = setTimeout(() => {
          if (this.ttsQueue.length === 0 && !this.isStreamingResponse) {
            this.finishTtsSession();
          }
        }, 3000);
        return;
      }

      this.finishTtsSession();
      return;
    }

    const nextSentence = this.ttsQueue.shift();
    if (!nextSentence) return;

    if ('speechSynthesis' in window) {
      this.isSpeaking = true;
      this.setState('speaking');

      const utterance = new SpeechSynthesisUtterance(nextSentence);
      utterance.rate = this.voiceConfig.rate || 1.0;
      utterance.pitch = this.voiceConfig.pitch || 1.0;
      utterance.volume = this.voiceConfig.volume || 1.0;

      if (this.voiceConfig.voiceURI) {
        const voices = window.speechSynthesis.getVoices();
        const selected = voices.find((v) => v.voiceURI === this.voiceConfig.voiceURI);
        if (selected) utterance.voice = selected;
      }

      utterance.onend = () => {
        this.currentUtterance = null;
        this.processTTSQueue();
      };

      utterance.onerror = (e) => {
        console.warn('[VoiceEngine TTS Utterance Notice]', e);
        this.currentUtterance = null;
        this.processTTSQueue();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('[VoiceEngine] window.speechSynthesis not supported.');
      this.finishTtsSession();
    }
  }

  private finishTtsSession() {
    this.isSpeaking = false;
    if (this.currentUtterance) {
      this.currentUtterance = null;
    }

    // 600ms Post-TTS Cooldown Buffer: allows speaker echo in room to dissipate completely before enabling mic STT
    this.isPostTtsCooldown = true;
    if (this.postTtsCooldownTimer) {
      clearTimeout(this.postTtsCooldownTimer);
    }

    this.postTtsCooldownTimer = setTimeout(() => {
      this.isPostTtsCooldown = false;
      if (this.state === 'speaking' || this.state === 'processing') {
        const nextState = this.voiceConfig.autoListen ? 'listening' : 'idle';
        this.setState(nextState);
        if (nextState === 'listening') {
          this.startSpeechRecognitionInternal();
        }
      }
    }, 600);
  }

  /* ==========================================
     BARGE-IN / EXPLICIT INTERRUPTION
     ========================================== */
  public interrupt() {
    console.log('[VoiceEngine] Explicit interruption triggered!');
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.streamGraceTimer) {
      clearTimeout(this.streamGraceTimer);
      this.streamGraceTimer = null;
    }
    if (this.postTtsCooldownTimer) {
      clearTimeout(this.postTtsCooldownTimer);
      this.postTtsCooldownTimer = null;
    }

    this.accumulatedInterimText = '';
    this.isStreamingResponse = false;
    this.isPostTtsCooldown = false;

    // 1. Clear speech synthesis queue & active playback
    this.ttsQueue = [];
    this.isSpeaking = false;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;

    // 2. Abort recognition and clear interim transcripts
    this.stopSpeechRecognitionInternal();

    // 3. Return to listening state
    if (this.state === 'speaking' || this.state === 'processing') {
      this.setState('listening');
      this.startSpeechRecognitionInternal();
    }
  }

  public destroy() {
    this.interrupt();
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
    }
    if (this.audioCtx) {
      this.audioCtx.close();
    }
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {
        // ignore
      }
    }
  }
}
