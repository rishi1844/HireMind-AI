'use client';
// frontend/components/chatbot/QuickChips.tsx
import React from 'react';
import { ChatMode } from '@/lib/chatStore';

interface Chip {
  label: string;
  message: string;
  mode?: ChatMode;
  emoji: string;
}

const CHIPS: Chip[] = [
  { emoji: '📊', label: 'Analyze Resume', message: 'What are the main weaknesses in my resume?', mode: 'chat' },
  { emoji: '🎯', label: 'Tailor for Job', message: 'I want to tailor my resume for a job posting.', mode: 'jd-tailor' },
  { emoji: '🎙️', label: 'Mock Interview', message: 'Start a mock interview based on my resume.', mode: 'mock-interview' },
  { emoji: '💼', label: 'LinkedIn DM', message: 'Write a LinkedIn outreach message for me.', mode: 'outreach' },
  { emoji: '💰', label: 'Salary Range', message: 'What is the current market salary range for my target role?', mode: 'salary' },
  { emoji: '✨', label: 'Improve Summary', message: 'Improve my professional summary to be more impactful.', mode: 'auto-fix' },
  { emoji: '📧', label: 'Cold Email', message: 'Write a cold email I can send to recruiters.', mode: 'outreach' },
  { emoji: '🚀', label: 'Project Ideas', message: 'Suggest portfolio project ideas that would strengthen my profile.', mode: 'chat' },
];

interface QuickChipsProps {
  onChipClick: (message: string, mode?: ChatMode) => void;
}

export default function QuickChips({ onChipClick }: QuickChipsProps) {
  return (
    <div className="chatbot-chips-wrapper">
      <p className="chatbot-chips-label">Quick Actions</p>
      <div className="chatbot-chips-scroll">
        {CHIPS.map((chip) => (
          <button
            key={chip.label}
            className="chatbot-chip"
            onClick={() => onChipClick(chip.message, chip.mode)}
            title={chip.label}
          >
            <span className="chatbot-chip-emoji">{chip.emoji}</span>
            <span>{chip.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
