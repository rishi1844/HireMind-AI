'use client';
// frontend/components/chatbot/ChatWindow.tsx — Vita AI Copilot (Green Wave Theme)
import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage, ChatAction } from '@/lib/chatStore';
import ReactMarkdown from 'react-markdown';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onActionApply: (action: ChatAction) => void;
}

function ActionButton({ action, onApply }: { action: ChatAction; onApply: (a: ChatAction) => void }) {
  const [done, setDone] = useState(false);

  const handle = () => {
    onApply(action);
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  };

  if (action.type === 'navigate') {
    // Inline link — opens in new tab, styled as glowing green text link
    return (
      <span className="vita-nav-link-wrap">
        <a
          className="vita-nav-link"
          href={action.target}
          target="_blank"
          rel="noopener noreferrer"
          title="Opens in a new tab"
        >
          {action.label || 'Open →'}
          <svg className="vita-nav-link-icon" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 10L10 2M10 2H5M10 2V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </span>
    );
  }
  if (action.type === 'copy-text') {
    return (
      <button className="vita-action-btn vita-action-btn--copy" onClick={handle}>
        {done ? '✅ Copied!' : `📋 ${action.label || 'Copy'}`}
      </button>
    );
  }
  return (
    <button className="vita-action-btn vita-action-btn--apply" onClick={handle}>
      {done ? '✅ Applied!' : '⚡ Apply to Resume'}
    </button>
  );
}

function TypingDots() {
  return (
    <div className="vita-msg vita-msg--ai">
      <div className="vita-avatar">
        <img src="/chatbot.png" alt="Vita" />
      </div>
      <div className="vita-bubble vita-bubble--ai">
        <div className="vita-typing">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg, onActionApply }: { msg: ChatMessage; onActionApply: (a: ChatAction) => void }) {
  const isUser = msg.role === 'user';

  return (
    <div className={`vita-msg ${isUser ? 'vita-msg--user' : 'vita-msg--ai'}`}>
      {!isUser && (
        <div className="vita-avatar">
          <img src="/chatbot.png" alt="Vita" />
        </div>
      )}

      <div className={`vita-bubble ${isUser ? 'vita-bubble--user' : 'vita-bubble--ai'}`}>
        {isUser ? (
          <p className="vita-user-text">{msg.content}</p>
        ) : (
          <div className="vita-md">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="vita-md-p">{children}</p>,
                strong: ({ children }) => <strong className="vita-md-strong">{children}</strong>,
                h2: ({ children }) => <h2 className="vita-md-h2">{children}</h2>,
                h3: ({ children }) => <h3 className="vita-md-h2" style={{ fontSize: '12.5px' }}>{children}</h3>,
                ul: ({ children }) => <ul className="vita-md-ul">{children}</ul>,
                li: ({ children }) => <li className="vita-md-li">{children}</li>,
                blockquote: ({ children }) => <blockquote className="vita-md-blockquote">{children}</blockquote>,
                a: ({ children, href }) => (
                  <a
                    href={href}
                    style={{ color: '#00e676', textDecoration: 'underline', textDecorationColor: 'rgba(0,230,118,0.4)' }}
                    target="_blank" rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {msg.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Match Score */}
        {msg.matchScore != null && (
          <div className="vita-match-wrap">
            <div
              className="vita-match-bar"
              style={{
                width: `${msg.matchScore}%`,
                background: msg.matchScore >= 70 ? '#00e676' : msg.matchScore >= 40 ? '#ffd600' : '#ef4444',
              }}
            />
            <span className="vita-match-label">{msg.matchScore}% Match</span>
          </div>
        )}

        {/* Action button */}
        {msg.action && <ActionButton action={msg.action} onApply={onActionApply} />}

        <span className="vita-timestamp">
          {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {isUser && (
        <div className="vita-avatar vita-avatar--user">
          <span>You</span>
        </div>
      )}
    </div>
  );
}

export default function ChatWindow({ messages, isLoading, onActionApply }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="vita-chat-messages">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} msg={msg} onActionApply={onActionApply} />
      ))}
      {isLoading && <TypingDots />}
      <div ref={bottomRef} />
    </div>
  );
}
