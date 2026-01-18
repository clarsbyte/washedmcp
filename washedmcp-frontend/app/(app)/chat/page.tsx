'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { useAppLoadAnimation } from '@/components/layout/AppLoadProvider';

type ChatRole = 'assistant' | 'user';

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  status?: 'delivered' | 'thinking';
}

const assistantResponses = [
  'Here is the concise summary you asked for — I noticed one MCP lagging by 2 minutes.',
  'I flipped through the latest context changes and nothing critical popped up.',
  'Let me consolidate the sync status and send you a quick brief.',
  'The graphs look balanced; highlight a node if you want a deeper dive.',
];

const quickPrompts = [
  'Summarize the last sync events',
  'Highlight MCP health risks',
  'Draft a status update',
];

const initialMessages: ChatMessage[] = [
  {
    id: 'm-1',
    role: 'assistant',
    content: 'Welcome back! Use me to scan MCP health or polish your next update.',
    timestamp: '09:42',
  },
  {
    id: 'm-2',
    role: 'user',
    content: 'Give me the latest context health summary.',
    timestamp: '09:43',
  },
  {
    id: 'm-3',
    role: 'assistant',
    content: 'All MCPs are stable; Neo4j-2 had a 30-second lag but recovered.',
    timestamp: '09:44',
  },
];

export default function ChatPage() {
  const { shouldAnimate, ready } = useAppLoadAnimation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasStarted) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, hasStarted]);

  const pageMotion = shouldAnimate
    ? { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } }
    : { initial: false, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: draft.trim(),
      timestamp,
    };
    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: assistantResponses[(messages.length + initialMessages.length) % assistantResponses.length],
      timestamp,
      status: 'thinking',
    };

    setMessages((prev) => {
      const base = hasStarted ? prev : initialMessages;
      return [...base, userMessage, assistantMessage];
    });
    setDraft('');
    setHasStarted(true);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id ? { ...assistantMessage, status: 'delivered' } : msg
        )
      );
    }, 600);
  };

  const handleQuickPrompt = (prompt: string) => {
    setDraft(prompt);
  };

  const bubbleClasses = useMemo(
    () => ({
      assistant: 'self-start bg-(--color-surface) border border-(--color-border) text-(--color-text-primary)',
      user: 'self-end bg-(--color-primary) text-white',
    }),
    []
  );

  if (!ready) {
    return <div className="min-h-screen p-6 opacity-0" />;
  }

  return (
    <motion.div
      className="flex min-h-screen flex-col gap-6 px-6 py-8"
      {...pageMotion}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold text-(--color-text-primary)">Agent Memory</h1>
        <div className="flex flex-wrap gap-2 text-[11px]">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleQuickPrompt(prompt)}
              className="rounded-full border border-(--color-border) px-3 py-1 text-(--color-text-secondary) transition hover:border-(--color-primary) hover:text-(--color-text-primary)"
            >
              {prompt}
            </button>
          ))}
        </div>
      </header>

      {hasStarted ? (
        <div className="flex flex-1 flex-col overflow-hidden rounded-[12px] border border-(--color-border) bg-(--color-background) shadow-[--shadow-subtle]">
          <div
            ref={scrollRef}
            className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6"
          >
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0.6, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`max-w-[85%] rounded-[10px] px-4 py-3 shadow-[--shadow-subtle] ${bubbleClasses[message.role]}`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-(--color-text-tertiary)">
                  <span>{message.timestamp}</span>
                  {message.status === 'thinking' ? <span>typing…</span> : <span>delivered</span>}
                </div>
              </motion.div>
            ))}
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-(--color-border) bg-(--color-surface) px-6 py-4"
          >
            <div className="flex items-end gap-3">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={1}
                className="flex-1 resize-none rounded-[10px] border border-(--color-border) bg-(--color-background) p-3 text-sm text-(--color-text-primary) focus:border-(--color-primary) focus:outline-none focus:ring-1 focus:ring-(--color-primary)"
                placeholder="Ask anything or describe an MCP scenario…"
                spellCheck={false}
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-[10px] bg-(--color-primary) px-4 py-2 text-sm font-semibold text-white shadow-[--shadow-subtle] transition hover:bg-(--color-primary-hover)"
              >
                <Send size={16} />
                Send
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-3xl">
            <div className="rounded-[16px] border border-(--color-border) bg-(--color-surface)/80 p-8 text-center shadow-[--shadow-subtle] backdrop-blur-lg">
              <p className="text-lg font-semibold text-(--color-text-primary)">
                Search your agent memory in seconds
              </p>
              <p className="mt-2 text-sm text-(--color-text-secondary)">
                Type your first query and the chat magically expands to the full workspace.
              </p>
              <form onSubmit={handleSubmit} className="mt-6">
                <div className="flex items-end gap-3">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    rows={1}
                    className="flex-1 resize-none rounded-[10px] border border-(--color-border) bg-(--color-background) p-3 text-sm text-(--color-text-primary) focus:border-(--color-primary) focus:outline-none focus:ring-1 focus:ring-(--color-primary)"
                    placeholder="Search agent memory…"
                    spellCheck={false}
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-[10px] bg-(--color-primary) px-4 py-2 text-sm font-semibold text-white shadow-[--shadow-subtle] transition hover:bg-(--color-primary-hover)"
                  >
                    <Send size={16} />
                    Start
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
