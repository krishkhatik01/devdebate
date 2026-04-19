'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDashboard } from './layout';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Message, ModeType, DebateResult, RoastResult, ExplainResult, ResearchResult, OptimizeResult } from '@/lib/types';
import ChatMessage from '@/components/ChatMessage';
import DebateView from '@/components/DebateView';
import CodeRoastView from '@/components/CodeRoastView';
import ArenaMode from '@/components/modes/ArenaMode';
import { useToast } from '@/components/Toast';
import SmartChatInput from '@/components/SmartChatInput';
import { Loader2, MessageSquare, Swords, Flame, Brain, Search, Zap, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const systemPrompts: Record<ModeType, string> = {
  chat: 'You are an expert software engineer and developer assistant. Answer concisely, use code blocks when relevant, and always explain your reasoning.',
  debate: '',
  roast: '',
  explain: '',
  research: '',
  optimize: '',
  arena: '',
  vision: '',
};

const modeConfig: Record<ModeType, { icon: React.ElementType; title: string; description: string; examples?: string[] }> = {
  chat: {
    icon: MessageSquare,
    title: 'Smart Chat',
    description: 'Ask me anything about software development. I\'ll provide concise answers with code examples and clear explanations.',
  },


  debate: {
    icon: Swords,
    title: 'Debate Mode',
    description: 'Enter a tech topic and our AI will argue both sides with a final verdict.',
    examples: ['REST vs GraphQL', 'Tabs vs Spaces', 'Microservices vs Monolith'],
  },
  roast: {
    icon: Flame,
    title: 'Code Roast',
    description: 'Paste your code to get brutally honest feedback with actionable fixes.',
  },
  explain: {
    icon: Brain,
    title: 'Explain Mode',
    description: 'Paste code or type a concept to get a 3-part explanation: ELI5, Technical Deep Dive, and Practical Advice.',
  },
  research: {
    icon: Search,
    title: 'Deep Research',
    description: 'Enter a tech topic for a comprehensive research report with pros/cons, benchmarks, and recommendations.',
  },
  optimize: {
    icon: Zap,
    title: 'Optimize Code',
    description: 'Paste your code and select the language to get performance optimization analysis with complexity improvements.',
  },
  arena: {
    icon: Swords,
    title: 'AI Battle Arena',
    description: 'Watch two AI models argue against each other. You just sit back and enjoy.',
  },
  vision: {
    icon: Search,
    title: 'Vision Mode',
    description: 'Upload or capture images for AI analysis.',
  },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { currentMode, setCurrentMode } = useDashboard();
  const { showToast, ToastContainer } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [debateResult, setDebateResult] = useState<DebateResult | null>(null);
  const [roastResult, setRoastResult] = useState<RoastResult | null>(null);
  const [roastIntensity, setRoastIntensity] = useState<'mild' | 'medium' | 'nuclear'>('medium');
  const [explainResult, setExplainResult] = useState<ExplainResult | null>(null);
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
  const [optimizeResult, setOptimizeResult] = useState<OptimizeResult | null>(null);
  const [optimizeLanguage, setOptimizeLanguage] = useState('javascript');

  const [debateTopic, setDebateTopic] = useState('');
  const [debateContext, setDebateContext] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const saveSession = async (mode: ModeType, title: string, msgs: Message[]) => {
    if (!user) return;

    try {
      const sessionData = {
        mode,
        title: title.slice(0, 50),
        messages: msgs.map(m => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })),
        createdAt: serverTimestamp(),
        userId: user.uid,
      };

      if (sessionId) {
        // Update existing session
      } else {
        const docRef = await addDoc(collection(db, 'sessions', user.uid, 'chats'), sessionData);
        setSessionId(docRef.id);
        showToast('Session saved to history', 'success');
      }
    } catch (error) {
      console.error('Error saving session:', error);
      showToast('Failed to save session', 'error');
    }
  };

  const handleChatSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          systemPrompt: systemPrompts[currentMode],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      const assistantContent = data.content || 'No response generated';

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      await saveSession(currentMode, userMessage.content, finalMessages);

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDebateSubmit = async () => {
    if (!debateTopic.trim() || isLoading) return;

    const topic = debateTopic;
    const context = debateContext;
    setDebateTopic('');
    setDebateContext('');
    setIsLoading(true);
    setDebateResult(null);

    try {
      const response = await fetch('/api/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic,
          context: context,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate debate');

      const result = await response.json();
      setDebateResult(result);

      const debateMessages: Message[] = [
        {
          id: Date.now().toString(),
          role: 'user',
          content: `Debate: ${topic}\nContext: ${context || 'None'}`,
          timestamp: new Date(),
        },
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `**FOR:**\n${result.for}\n\n**AGAINST:**\n${result.against}\n\n**VERDICT:**\n${result.verdict}`,
          timestamp: new Date(),
        },
      ];
      await saveSession('debate', topic, debateMessages);

    } catch (error) {
      console.error('Debate error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoastSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const code = input;
    setInput('');
    setIsLoading(true);
    setRoastResult(null);

    try {
      const response = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code,
          intensity: roastIntensity,
        }),
      });

      if (!response.ok) throw new Error('Failed to roast code');

      const result = await response.json();
      setRoastResult(result);

      const roastMessages: Message[] = [
        {
          id: Date.now().toString(),
          role: 'user',
          content: `Roast my code (${roastIntensity}):\n\`\`\`\n${code}\n\`\`\``,
          timestamp: new Date(),
        },
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `**ROAST:**\n${result.roast}\n\n**FIXED:**\n${result.fixed}`,
          timestamp: new Date(),
        },
      ];
      await saveSession('roast', 'Code Roast', roastMessages);

    } catch (error) {
      console.error('Roast error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExplainSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const query = input;
    setInput('');
    setIsLoading(true);
    setExplainResult(null);

    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: query }),
      });

      if (!response.ok) throw new Error('Failed to explain');

      const result = await response.json();
      setExplainResult(result);

      const explainMessages: Message[] = [
        {
          id: Date.now().toString(),
          role: 'user',
          content: `Explain: ${query}`,
          timestamp: new Date(),
        },
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.explanation,
          timestamp: new Date(),
        },
      ];
      await saveSession('explain', `Explain: ${query.slice(0, 30)}...`, explainMessages);

    } catch (error) {
      console.error('Explain error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResearchSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const topic = input;
    setInput('');
    setIsLoading(true);
    setResearchResult(null);

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic }),
      });

      if (!response.ok) throw new Error('Failed to research');

      const result = await response.json();
      setResearchResult(result);

      const researchMessages: Message[] = [
        {
          id: Date.now().toString(),
          role: 'user',
          content: `Research: ${topic}`,
          timestamp: new Date(),
        },
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.report,
          timestamp: new Date(),
        },
      ];
      await saveSession('research', `Research: ${topic.slice(0, 30)}...`, researchMessages);

    } catch (error) {
      console.error('Research error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimizeSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const code = input;
    setInput('');
    setIsLoading(true);
    setOptimizeResult(null);

    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code,
          language: optimizeLanguage,
        }),
      });

      if (!response.ok) throw new Error('Failed to optimize');

      const result = await response.json();
      setOptimizeResult(result);

      const optimizeMessages: Message[] = [
        {
          id: Date.now().toString(),
          role: 'user',
          content: `Optimize ${optimizeLanguage} code:\n\`\`\`\n${code}\n\`\`\``,
          timestamp: new Date(),
        },
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `**ISSUES:**\n${result.issues}\n\n**OPTIMIZED:**\n${result.optimized}`,
          timestamp: new Date(),
        },
      ];
      await saveSession('optimize', `Optimize: ${optimizeLanguage}`, optimizeMessages);

    } catch (error) {
      console.error('Optimize error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    switch (currentMode) {
      case 'chat':
        handleChatSubmit();
        break;
      case 'debate':
        handleDebateSubmit();
        break;
      case 'roast':
        handleRoastSubmit();
        break;
      case 'explain':
        handleExplainSubmit();
        break;
      case 'research':
        handleResearchSubmit();
        break;
      case 'optimize':
        handleOptimizeSubmit();
        break;
      case 'arena':
        // Arena mode handles its own submission
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const renderEmptyState = () => {
    const config = modeConfig[currentMode];
    const Icon = config.icon;

    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center mb-6">
          <Icon className="w-8 h-8 text-[var(--accent-primary)]" />
        </div>
        <h3 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-2">
          {config.title}
        </h3>
        <p className="text-[var(--text-secondary)] max-w-md mb-6 text-sm">
          {config.description}
        </p>
        {config.examples && (
          <div className="flex flex-wrap gap-2 justify-center">
            {config.examples.map((example) => (
              <button
                key={example}
                onClick={() => {
                  if (currentMode === 'debate') {
                    setDebateTopic(example);
                  }
                }}
                className="px-3 py-1.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-sm hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border)]"
              >
                {example}
              </button>
            ))}
          </div>
        )}
        {currentMode === 'optimize' && (
          <select
            value={optimizeLanguage}
            onChange={(e) => setOptimizeLanguage(e.target.value)}
            className="px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
        )}
      </div>
    );
  };

  const renderModeContent = () => {
    switch (currentMode) {
      case 'debate':
        return (
          <DebateView
            result={debateResult}
            isLoading={isLoading}
            onSave={() => { }}
          />
        );
      case 'roast':
        return (
          <CodeRoastView
            result={roastResult}
            isLoading={isLoading}
            intensity={roastIntensity}
            onIntensityChange={setRoastIntensity}
            onSave={() => { }}
          />
        );
      case 'explain':
        if (!explainResult && !isLoading) return renderEmptyState();
        if (explainResult) {
          return (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
                <div className="bg-[var(--accent-secondary)]/10 px-4 py-3 border-b border-[var(--accent-secondary)]/30">
                  <h3 className="font-display font-semibold text-[var(--accent-secondary)]">Explanation</h3>
                </div>
                <div className="p-4 prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{explainResult.explanation}</ReactMarkdown>
                </div>
              </div>
            </div>
          );
        }
        return null;
      case 'research':
        if (!researchResult && !isLoading) return renderEmptyState();
        if (researchResult) {
          return (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
                <div className="bg-[var(--accent-warning)]/10 px-4 py-3 border-b border-[var(--accent-warning)]/30">
                  <h3 className="font-display font-semibold text-[var(--accent-warning)]">Research Report</h3>
                </div>
                <div className="p-4 prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{researchResult.report}</ReactMarkdown>
                </div>
              </div>
            </div>
          );
        }
        return null;
      case 'optimize':
        if (!optimizeResult && !isLoading) return renderEmptyState();
        if (optimizeResult) {
          return (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
                <div className="bg-[var(--accent-danger)]/10 px-4 py-3 border-b border-[var(--accent-danger)]/30">
                  <h3 className="font-display font-semibold text-[var(--accent-danger)]">Issues Found</h3>
                </div>
                <div className="p-4 prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{optimizeResult.issues}</ReactMarkdown>
                </div>
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
                <div className="bg-[var(--accent-secondary)]/10 px-4 py-3 border-b border-[var(--accent-secondary)]/30">
                  <h3 className="font-display font-semibold text-[var(--accent-secondary)]">Optimized Code</h3>
                </div>
                <div className="p-4">
                  <pre className="code-block p-4 rounded-lg overflow-x-auto">
                    <code className="font-mono text-[13px] text-[var(--text-primary)]">{optimizeResult.optimized}</code>
                  </pre>
                </div>
              </div>
            </div>
          );
        }
        return null;
      case 'arena':
        return <ArenaMode />;
      default:
        if (messages.length === 0 && !isLoading) return renderEmptyState();
        return (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isLoading={isLoading && message === messages[messages.length - 1] && message.role === 'assistant'}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        );
    }
  };

  const getPlaceholder = () => {
    return '';
  };

  const CurrentIcon = modeConfig[currentMode].icon;

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
      {/* Top Bar */}
      <header className="h-[52px] border-b border-[var(--border)] flex items-center justify-between px-6 bg-[var(--bg-primary)]">
        <div className="flex items-center gap-2">
          <CurrentIcon className="w-4 h-4 text-[var(--accent-primary)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">{modeConfig[currentMode].title}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border)] font-mono text-[10px]">⌘</kbd>
          <span>+</span>
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border)] font-mono text-[10px]">Enter</kbd>
          <span className="ml-1">to send</span>
        </div>
      </header>

      {/* Main Content */}
      {renderModeContent()}

      {/* Toast Container */}
      <ToastContainer />

      {/* Input Area */}
      <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
        {currentMode === 'debate' ? (
          <div className="max-w-4xl mx-auto space-y-3">
            <input
              type="text"
              value={debateTopic}
              onChange={(e) => setDebateTopic(e.target.value)}
              placeholder=""
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-strong)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_3px_rgba(0,212,255,0.1)] transition-all"
            />
            <textarea
              value={debateContext}
              onChange={(e) => setDebateContext(e.target.value)}
              placeholder=""
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-strong)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_3px_rgba(0,212,255,0.1)] transition-all resize-none h-20"
            />
            <button
              onClick={handleDebateSubmit}
              disabled={!debateTopic.trim() || isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--accent-primary)] text-[#0a0a0b] font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating debate...
                </>
              ) : (
                <>
                  <Swords className="w-5 h-5" />
                  Start Debate
                </>
              )}
            </button>
          </div>
        ) : currentMode === 'chat' ? (
          <SmartChatInput
            input={input}
            setInput={setInput}
            onSend={handleChatSubmit}
            isLoading={isLoading}
            currentMode={currentMode}
            onModeChange={setCurrentMode}
          />
        ) : (
          <div className="max-w-4xl mx-auto relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholder()}
              className="w-full px-4 py-3.5 pr-14 rounded-xl bg-[var(--bg-card)] border border-[var(--border-strong)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_3px_rgba(0,212,255,0.1)] transition-all resize-none min-h-[52px] max-h-[200px] scrollbar-thin"
              rows={1}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--accent-primary)] text-[#0a0a0b] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
