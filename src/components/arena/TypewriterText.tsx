"use client";
import { useState, useEffect } from "react";

interface Props {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export default function TypewriterText({
  text, speed = 15, className = "", onComplete
}: Props) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  return (
    <p className={className}>
      {displayed}
      {displayed.length < text.length && (
        <span className="animate-pulse text-[var(--accent-primary)]">|</span>
      )}
    </p>
  );
}
