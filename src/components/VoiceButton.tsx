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
  const [supported, setSupported] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSupported(false);
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    // Use best available voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.name.includes("Google") || v.name.includes("Natural")
    );
    if (preferred) utterance.voice = preferred;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  if (!supported) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Mic Button */}
      <button
        onClick={toggleListening}
        disabled={disabled}
        title={isListening ? "Stop listening" : "Start voice input"}
        className={`p-2 rounded-xl transition-all ${isListening
            ? "bg-red-500 text-white animate-pulse"
            : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]"
          } border border-[var(--border)]`}
      >
        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
      </button>

      {/* Speaker Button - only show when there's text to speak */}
      {onSpeakText && (
        <button
          onClick={() => speakText(onSpeakText)}
          title={isSpeaking ? "Stop speaking" : "Read aloud"}
          className={`p-2 rounded-xl transition-all ${isSpeaking
              ? "bg-[var(--accent-primary)] text-white"
              : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)]"
            } border border-[var(--border)]`}
        >
          {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      )}

      {isListening && (
        <span className="text-xs text-red-400 animate-pulse">
          Listening...
        </span>
      )}
    </div>
  );
}
