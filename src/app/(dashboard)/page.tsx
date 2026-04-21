'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDashboard } from './layout';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Message, ModeType } from '@/lib/types';
import ChatMessage from '@/components/ChatMessage';
import { useToast } from '@/components/Toast';
import SmartChatInput from '@/components/SmartChatInput';
import { MessageSquare, Swords, Flame, Brain, Search, Zap, Trash2 } from 'lucide-react';

const systemPrompts: Record<ModeType, string> = {
  chat: 'You are an expert software engineer and developer assistant. Answer concisely, use code blocks when relevant, and always explain your reasoning.',
  debate: '',
  roast: '',
  explain: '',
  research: '',
  optimize: '',
  arena: '',
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
    description: 'Watch two AI models argue against each other over multiple rounds.',
  },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { currentMode, setCurrentMode } = useDashboard();
  const { showToast, ToastContainer } = useToast();
  
  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>({
    chat: [],
    explain: [],
    roast: [],
    debate: [],
    research: [],
    optimize: [],
    arena: [],
  });

  const currentMessages = allMessages[currentMode] || [];

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [roastIntensity, setRoastIntensity] = useState<'mild' | 'medium' | 'nuclear'>('medium');
  const [optimizeLanguage, setOptimizeLanguage] = useState('javascript');
  const [debateTopic, setDebateTopic] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, isLoading]);

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

      if (!sessionId) {
        const docRef = await addDoc(collection(db, 'sessions', user.uid, 'chats'), sessionData);
        setSessionId(docRef.id);
        showToast(`Session saved`, 'success');
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const clearChat = () => {
    setAllMessages(prev => ({
      ...prev,
      [currentMode]: [],
    }));
    setSessionId(null);
  };

  const appendMessages = (userMsg: Message, aiMsg: Message) => {
    setAllMessages(prev => {
      const modeMsgs = [...(prev[currentMode] || []), userMsg, aiMsg];
      saveSession(currentMode as ModeType, userMsg.content, modeMsgs);
      return {
        ...prev,
        [currentMode]: modeMsgs,
      };
    });
  };

  const getHistoryPayload = () => {
    return currentMessages.map(m => ({
      role: m.role,
      content: m.content
    }));
  };

  const handleChatSubmit = async (imageData?: { base64: string; mimeType: string }) => {
    const userContent = imageData ? `[Image attached] ${input.trim() || 'Analyze this image'}` : input.trim();
    
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: userContent, timestamp: new Date() };
    
    setAllMessages(prev => ({ ...prev, [currentMode]: [...(prev[currentMode] || []), userMessage] }));
    setInput('');
    setIsLoading(true);

    try {
      let assistantContent: string;
      if (imageData) {
        const response = await fetch('/api/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: imageData.base64,
            mimeType: imageData.mimeType,
            message: input.trim() || 'Analyze this image',
          }),
        });
        const data = await response.json();
        assistantContent = data.result || 'No response';
      } else {
        const history = getHistoryPayload();
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...history, { role: 'user', content: userContent }],
            systemPrompt: systemPrompts[currentMode as ModeType],
          }),
        });
        const data = await response.json();
        assistantContent = data.content || 'No response';
      }

      const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: assistantContent, timestamp: new Date() };
      
      appendMessages(userMessage, assistantMessage);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDebateSubmit = async () => {
    const topic = debateTopic || input;
    if (!topic.trim() || isLoading) return;
    
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: `Debate: ${topic}`, timestamp: new Date() };
    setAllMessages(prev => ({ ...prev, [currentMode]: [...(prev[currentMode] || []), userMessage] }));
    
    setDebateTopic('');
    setInput('');
    setIsLoading(true);

    try {
      const history = getHistoryPayload();
      const response = await fetch('/api/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...history, { role: 'user', content: `Debate topic: ${topic}` }] }),
      });
      const result = await response.json();
      const content = `**FOR:**\n${result.for}\n\n**AGAINST:**\n${result.against}\n\n**VERDICT:**\n${result.verdict}`;
      const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content, timestamp: new Date() };
      
      appendMessages(userMessage, assistantMessage);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoastSubmit = async () => {
    if (!input.trim() || isLoading) return;
    const code = input;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: `Roast my code (${roastIntensity}):\n\`\`\`\n${code}\n\`\`\``, timestamp: new Date() };
    setAllMessages(prev => ({ ...prev, [currentMode]: [...(prev[currentMode] || []), userMessage] }));
    setInput('');
    setIsLoading(true);

    try {
      const history = getHistoryPayload();
      const response = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...history, { role: 'user', content: `Roast this code (${roastIntensity}):\n\`\`\`\n${code}\n\`\`\`` }], intensity: roastIntensity }),
      });
      const result = await response.json();
      const content = `**ROAST:**\n${result.roast}\n\n**FIXED:**\n${result.fixed}`;
      const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content, timestamp: new Date() };
      
      appendMessages(userMessage, assistantMessage);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExplainSubmit = async () => {
    if (!input.trim() || isLoading) return;
    const query = input;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: `Explain: ${query}`, timestamp: new Date() };
    setAllMessages(prev => ({ ...prev, [currentMode]: [...(prev[currentMode] || []), userMessage] }));
    setInput('');
    setIsLoading(true);

    try {
      const history = getHistoryPayload();
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...history, { role: "user", content: query }] }),
      });
      const result = await response.json();
      const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: result.explanation, timestamp: new Date() };
      appendMessages(userMessage, assistantMessage);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResearchSubmit = async () => {
    if (!input.trim() || isLoading) return;
    const topic = input;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: `Research: ${topic}`, timestamp: new Date() };
    setAllMessages(prev => ({ ...prev, [currentMode]: [...(prev[currentMode] || []), userMessage] }));
    setInput('');
    setIsLoading(true);

    try {
      const history = getHistoryPayload();
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...history, { role: 'user', content: `Write a research report on: ${topic}` }] }),
      });
      const result = await response.json();
      const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: result.report, timestamp: new Date() };
      appendMessages(userMessage, assistantMessage);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimizeSubmit = async () => {
    if (!input.trim() || isLoading) return;
    const code = input;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: `Optimize ${optimizeLanguage} code:\n\`\`\`${optimizeLanguage}\n${code}\n\`\`\``, timestamp: new Date() };
    setAllMessages(prev => ({ ...prev, [currentMode]: [...(prev[currentMode] || []), userMessage] }));
    setInput('');
    setIsLoading(true);

    try {
      const history = getHistoryPayload();
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...history, { role: 'user', content: `Optimize this ${optimizeLanguage} code:\n\`\`\`${optimizeLanguage}\n${code}\n\`\`\`` }], language: optimizeLanguage }),
      });
      const result = await response.json();
      const content = `**ISSUES FOUND:**\n${result.issues}\n\n**OPTIMIZED CODE:**\n${result.optimized}`;
      const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content, timestamp: new Date() };
      appendMessages(userMessage, assistantMessage);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArenaSubmit = async () => {
    if (!input.trim() || isLoading) return;
    const topic = input;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: `Arena Battle: ${topic}`, timestamp: new Date() };
    setAllMessages(prev => ({ ...prev, [currentMode]: [...(prev[currentMode] || []), userMessage] }));
    setInput('');
    setIsLoading(true);

    try {
      const history = getHistoryPayload();
      const response = await fetch('/api/arena/battle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic, 
          round: 1, 
          totalRounds: 1, 
          roundType: 'Opening',
          forModel: 'llama-3.3-70b-versatile',
          againstModel: 'llama-3.1-8b-instant',
          messages: [...history, { role: 'user', content: `Debate this topic: ${topic}` }] 
        }),
      });
      const result = await response.json();
      
      const content = `**🤖 FOR (llama-3.3-70b):**\n${result.forArgument}\n\n**🤖 AGAINST (llama-3.1-8b):**\n${result.againstArgument}\n\n**⚖️ JUDGE:**\nWinner: ${result.roundWinner} (FOR: ${result.forScore}/10 | AGAINST: ${result.againstScore}/10)\n${result.forFeedback} ${result.againstFeedback}`;
      
      const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content, timestamp: new Date() };
      appendMessages(userMessage, assistantMessage);
    } catch(err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };


  const handleSubmit = (imageData?: { base64: string; mimeType: string }) => {
    switch (currentMode) {
      case 'chat': handleChatSubmit(imageData); break;
      case 'debate': handleDebateSubmit(); break;
      case 'roast': handleRoastSubmit(); break;
      case 'explain': handleExplainSubmit(); break;
      case 'research': handleResearchSubmit(); break;
      case 'optimize': handleOptimizeSubmit(); break;
      case 'arena': handleArenaSubmit(); break;
    }
  };

  const renderEmptyState = () => {
    const config = modeConfig[currentMode as ModeType];
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
                onClick={() => { setInput(example); setDebateTopic(example); }}
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
            className="mt-4 px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
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
        {currentMode === 'roast' && (
          <select
            value={roastIntensity}
            onChange={(e) => setRoastIntensity(e.target.value as "mild" | "medium" | "nuclear")}
            className="mt-4 px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
          >
            <option value="mild">Mild (Gentle Feedback)</option>
            <option value="medium">Medium (Honest Critique)</option>
            <option value="nuclear">Nuclear (Destroy Me)</option>
          </select>
        )}
      </div>
    );
  };

  const CurrentIcon = modeConfig[currentMode as ModeType].icon;

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
      {/* Top Bar */}
      <header className="h-[52px] border-b border-[var(--border)] flex items-center justify-between px-6 bg-[var(--bg-primary)]">
        <div className="flex items-center gap-2">
          <CurrentIcon className="w-4 h-4 text-[var(--accent-primary)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">{modeConfig[currentMode as ModeType].title}</span>
        </div>
        <button
          onClick={clearChat}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all text-xs border border-transparent hover:border-[var(--border)]"
        >
          <Trash2 size={14} /> Clear Chat
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {currentMessages.length === 0 && !isLoading ? (
          renderEmptyState()
        ) : (
          <>
            {currentMessages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isLoading={false}
              />
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 w-full max-w-4xl mx-auto opacity-0 animate-[fadeIn_0.3s_ease-out_forwards]">
                <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-strong)] flex items-center justify-center flex-shrink-0 mt-1">
                  🤖
                </div>
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl rounded-tl-sm px-5 py-3.5 flex items-center gap-2 h-10">
                  <div className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-[bounce_1.4s_infinite_ease-in-out_both] [animation-delay:-0.32s]"></div>
                  <div className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-[bounce_1.4s_infinite_ease-in-out_both] [animation-delay:-0.16s]"></div>
                  <div className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-[bounce_1.4s_infinite_ease-in-out_both]"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <ToastContainer />

      {/* Input Area */}
      <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
        <SmartChatInput
          input={input}
          setInput={setInput}
          onSend={handleSubmit}
          isLoading={isLoading}
          currentMode={currentMode}
          onModeChange={setCurrentMode}
        />
      </div>
    </div>
  );
}
