"use client";
import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  onSpeakText?: string;
  disabled?: boolean;
}

export default function VoiceButton({
  onTranscript, onSpeakText, disabled
}: VoiceButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check TTS support
    if ("speechSynthesis" in window) {
      setTtsSupported(true);
    }

    // Check Speech Recognition support
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;
    setMicSupported(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SpeechRecognition() as any;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        onTranscript(finalTranscript);
        setIsListening(false);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Recognition start error:", e);
      }
    }
  };

  const speakText = () => {
    if (!window.speechSynthesis) return;

    // If already speaking, stop
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!onSpeakText) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(onSpeakText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = "en-US";

    // Wait for voices to load — KEY FIX
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find(v => v.name.includes("Google US English")) ||
        voices.find(v => v.name.includes("Google") && v.lang === "en-US") ||
        voices.find(v => v.lang === "en-US" && !v.localService) ||
        voices.find(v => v.lang.startsWith("en")) ||
        voices[0];
      if (preferred) utterance.voice = preferred;
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      setVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = setVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    utterance.onerror = (e) => {
      console.error("TTS error:", e);
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;

    // Small delay to ensure voices are loaded — KEY FIX
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 100);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      recognitionRef.current?.stop();
    };
  }, []);

  // Fix Chrome bug: speech pauses after ~15 seconds
  useEffect(() => {
    if (!isSpeaking) return;
    const interval = setInterval(() => {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isSpeaking]);

  return (
    <div className="flex items-center gap-1.5">
      {/* Mic Button */}
      {micSupported && (
        <button
          onClick={toggleListening}
          disabled={disabled}
          title={isListening ? "Stop listening" : "Voice input"}
          className={`p-2 rounded-xl transition-all border ${isListening
              ? "bg-red-500 border-red-500 text-white animate-pulse"
              : "bg-transparent border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]"
            }`}
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
      )}

      {/* TTS Button - only show when there is text to speak */}
      {ttsSupported && onSpeakText && onSpeakText.length > 0 && (
        <button
          onClick={speakText}
          title={isSpeaking ? "Stop speaking" : "Read aloud"}
          className={`p-2 rounded-xl transition-all border ${isSpeaking
              ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white"
              : "bg-transparent border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]"
            }`}
        >
          {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      )}

      {isListening && (
        <span className="text-xs text-red-400 animate-pulse font-medium">
          Listening...
        </span>
      )}
    </div>
  );
}
