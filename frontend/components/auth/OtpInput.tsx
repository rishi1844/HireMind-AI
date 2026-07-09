"use client";

import { useEffect, useRef } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OtpInput({ value, onChange, disabled = false }: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: 6 }, (_, index) => value[index] || "");

  useEffect(() => {
    if (value.length === 0 && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [value]);

  const handleChange = (index: number, rawValue: string) => {
    if (disabled) {
      return;
    }
    const cleaned = rawValue.replace(/[^0-9]/g, "").slice(0, 1);
    if (!cleaned) {
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = cleaned;
    onChange(nextDigits.join(""));

    const nextIndex = Math.min(index + 1, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) {
      return;
    }
    if (event.key === "Backspace") {
      event.preventDefault();
      const nextDigits = [...digits];
      if (nextDigits[index]) {
        nextDigits[index] = "";
        onChange(nextDigits.join(""));
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        nextDigits[index - 1] = "";
        onChange(nextDigits.join(""));
      }
    }
    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled) {
      return;
    }
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) {
      return;
    }
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex items-center justify-between gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(ref) => {
            inputRefs.current[index] = ref;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          className="h-14 w-12 rounded-2xl border border-white/15 bg-white/5 text-center text-xl text-white outline-none transition focus:border-cyan-400 focus:bg-white/10"
        />
      ))}
    </div>
  );
}
