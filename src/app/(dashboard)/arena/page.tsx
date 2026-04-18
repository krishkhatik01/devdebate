"use client";
import { useState } from "react";
import { Swords, RotateCcw, Share2 } from "lucide-react";
import TypewriterText from "@/components/arena/TypewriterText";
import ScoreBoard from "@/components/arena/ScoreBoard";

const MODELS = [
  {
    id: "llama-3.3-70b-versatile",
    name: "LLaMA 3.3 70B",
    avatar: "🦙",
    color: "cyan"
  },
  {
    id: "llama-3.1-8b-instant",
    name: "LLaMA 3.1 8B",
    avatar: "⚡",
    color: "yellow"
  },
  {
    id: "gemma2-9b-it",
    name: "Gemma 2 9B",
    avatar: "💎",
    color: "pink"
  },
  {
    id: "deepseek-r1-distill-llama-70b",
    name: "DeepSeek R1",
    avatar: "🔍",
    color: "blue"
  },
];

const EXAMPLE_TOPICS = [
  "React vs Vue.js",
  "AI will replace developers",
  "TypeScript is overrated",
  "NoSQL is better than SQL",
  "Microservices vs Monolith",
  "Tabs vs Spaces",
  "Python vs JavaScript for backend",
  "Linux vs Windows for development",
];

type Round = {
  round: number;
  roundType: string;
  forArgument: string;
  againstArgument: string;
  forScore: number;
  againstScore: number;
  forFeedback: string;
  againstFeedback: string;
  roundWinner: string;
};

export default function ArenaPage() {
  // Setup state
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");
  const [forModel, setForModel] = useState(MODELS[0]);
  const [againstModel, setAgainstModel] = useState(MODELS[3]);
  const [totalRounds, setTotalRounds] = useState(3);

  // Battle state
  const [status, setStatus] = useState<
    "idle" | "countdown" | "battling" | "finished"
  >("idle");
  const [countdown, setCountdown] = useState(3);
  const [currentRound, setCurrentRound] = useState(0);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [totalScores, setTotalScores] = useState({ for: 0, against: 0 });
  const [currentForArg, setCurrentForArg] = useState("");
  const [currentAgainstArg, setCurrentAgainstArg] = useState("");
  const [thinkingFor, setThinkingFor] = useState(false);
  const [thinkingAgainst, setThinkingAgainst] = useState(false);
  const [currentRoundData, setCurrentRoundData] = useState<Round | null>(null);
  const [error, setError] = useState("");

  const startCountdown = () => {
    if (!topic.trim()) {
      setError("Please enter a debate topic");
      return;
    }
    if (forModel.id === againstModel.id) {
      setError("Please select different models");
      return;
    }
    setError("");
    setStatus("countdown");
    let count = 3;
    setCountdown(3);
    const timer = setInterval(() => {
      count--;
      if (count === 0) {
        clearInterval(timer);
        startBattle();
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  const startBattle = async () => {
    setStatus("battling");
    setRounds([]);
    setTotalScores({ for: 0, against: 0 });

    const allPreviousArgs: { round: number; side: string; content: string }[] = [];
    let forTotal = 0;
    let againstTotal = 0;

    for (let round = 1; round <= totalRounds; round++) {
      setCurrentRound(round);
      setCurrentForArg("");
      setCurrentAgainstArg("");
      setCurrentRoundData(null);

      const roundType =
        round === 1 ? "opening" : round === totalRounds ? "closing" : "counter";

      setThinkingFor(true);
      setThinkingAgainst(false);

      try {
        const res = await fetch("/api/arena/battle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            context,
            forModel: forModel.id,
            againstModel: againstModel.id,
            round,
            totalRounds,
            roundType,
            previousArguments: allPreviousArgs,
          }),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setThinkingFor(false);
        setCurrentForArg(data.forArgument);

        await new Promise((r) => setTimeout(r, data.forArgument.length * 15 + 500));

        setThinkingAgainst(true);
        await new Promise((r) => setTimeout(r, 800));
        setThinkingAgainst(false);
        setCurrentAgainstArg(data.againstArgument);

        await new Promise((r) => setTimeout(r, data.againstArgument.length * 15 + 500));

        setCurrentRoundData(data);

        allPreviousArgs.push(
          { round, side: "for", content: data.forArgument },
          { round, side: "against", content: data.againstArgument }
        );

        forTotal += data.forScore;
        againstTotal += data.againstScore;
        setTotalScores({ for: forTotal, against: againstTotal });
        setRounds((prev) => [...prev, data]);

        if (round < totalRounds) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Battle failed";
        setError(errorMessage);
        setStatus("idle");
        return;
      }
    }

    setStatus("finished");
  };

  const reset = () => {
    setStatus("idle");
    setRounds([]);
    setCurrentRound(0);
    setTotalScores({ for: 0, against: 0 });
    setCurrentForArg("");
    setCurrentAgainstArg("");
    setCurrentRoundData(null);
    setTopic("");
    setContext("");
  };

  const getWinner = () => {
    if (totalScores.for > totalScores.against) return forModel;
    if (totalScores.against > totalScores.for) return againstModel;
    return null;
  };

  const shareResult = () => {
    const winner = getWinner();
    const text = `🤖 AI Battle Result on DevDebate!\nTopic: ${topic}\n${forModel.avatar} ${forModel.name}: ${totalScores.for}pts\n${againstModel.avatar} ${againstModel.name}: ${totalScores.against}pts\nWinner: ${winner ? winner.name : "Draw!"}\nWatch AI models debate: devdebate.vercel.app/arena`;
    navigator.clipboard.writeText(text);
    alert("Result copied to clipboard!");
  };

  // SETUP SCREEN
  if (status === "idle") {
    return (
      <div className="flex flex-col h-full overflow-y-auto p-6 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Swords size={32} className="text-[var(--accent-primary)]" />
            <h1 className="text-3xl font-bold font-display text-[var(--text-primary)]">
              AI Battle Arena
            </h1>
          </div>
          <p className="text-[var(--text-secondary)]">
            Watch two AI models argue against each other. You just sit back and enjoy.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 
            text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Topic Input */}
        <div className="mb-4">
          <label className="block text-sm text-[var(--text-secondary)] mb-2">
            Debate Topic *
          </label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. TypeScript is overrated"
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] 
              border border-[var(--border-strong)] text-[var(--text-primary)]
              focus:outline-none focus:border-[var(--accent-primary)]
              focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
          />
        </div>

        {/* Example Topics */}
        <div className="flex flex-wrap gap-2 mb-6">
          {EXAMPLE_TOPICS.map((t) => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className="px-3 py-1.5 rounded-full text-xs border 
                border-[var(--border)] text-[var(--text-secondary)]
                hover:border-[var(--accent-primary)] 
                hover:text-[var(--accent-primary)] transition-all"
            >
              {t}
            </button>
          ))}
        </div>

        {/* Context Input */}
        <div className="mb-6">
          <label className="block text-sm text-[var(--text-secondary)] mb-2">
            Context (optional)
          </label>
          <input
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g. startup, 3 devs, Node.js backend"
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)]
              border border-[var(--border-strong)] text-[var(--text-primary)]
              focus:outline-none focus:border-[var(--accent-primary)] transition-all"
          />
        </div>

        {/* Model Selection */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm mb-2 text-green-400 font-medium">
              FOR Model
            </label>
            <div className="space-y-2">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setForModel(m)}
                  className={`w-full flex items-center gap-3 px-4 py-3 
                    rounded-xl border transition-all text-left
                    ${forModel.id === m.id
                      ? "border-green-500 bg-green-500/10 text-[var(--text-primary)]"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-green-500/50"
                    }`}
                >
                  <span className="text-xl">{m.avatar}</span>
                  <span className="text-sm font-medium">{m.name}</span>
                  {forModel.id === m.id && (
                    <span className="ml-auto text-green-400 text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2 text-red-400 font-medium">
              AGAINST Model
            </label>
            <div className="space-y-2">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setAgainstModel(m)}
                  className={`w-full flex items-center gap-3 px-4 py-3 
                    rounded-xl border transition-all text-left
                    ${againstModel.id === m.id
                      ? "border-red-500 bg-red-500/10 text-[var(--text-primary)]"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-red-500/50"
                    }`}
                >
                  <span className="text-xl">{m.avatar}</span>
                  <span className="text-sm font-medium">{m.name}</span>
                  {againstModel.id === m.id && (
                    <span className="ml-auto text-red-400 text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rounds Selector */}
        <div className="mb-8">
          <label className="block text-sm text-[var(--text-secondary)] mb-2">
            Number of Rounds
          </label>
          <div className="flex gap-3">
            {[1, 2, 3].map((r) => (
              <button
                key={r}
                onClick={() => setTotalRounds(r)}
                className={`flex-1 py-2 rounded-xl border font-medium transition-all
                  ${totalRounds === r
                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                    : "border-[var(--border)] text-[var(--text-secondary)]"
                  }`}
              >
                {r} {r === 1 ? "Round" : "Rounds"}
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={startCountdown}
          className="w-full py-4 rounded-xl font-bold text-lg
            bg-gradient-to-r from-[var(--accent-primary)] to-purple-500
            text-white hover:opacity-90 transition-all hover:scale-[1.02]
            flex items-center justify-center gap-3"
        >
          <Swords size={20} />
          Start AI Battle
        </button>
      </div>
    );
  }

  // COUNTDOWN SCREEN
  if (status === "countdown") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="text-4xl mb-2">{forModel.avatar}</div>
            <div className="text-sm text-green-400">{forModel.name}</div>
          </div>
          <div className="text-6xl font-bold text-[var(--accent-primary)] 
            animate-pulse font-display">
            {countdown}
          </div>
          <div className="text-center">
            <div className="text-4xl mb-2">{againstModel.avatar}</div>
            <div className="text-sm text-red-400">{againstModel.name}</div>
          </div>
        </div>
        <p className="text-[var(--text-secondary)] text-lg">Get ready...</p>
        <p className="text-[var(--text-primary)] font-medium">&quot;{topic}&quot;</p>
      </div>
    );
  }

  // BATTLE SCREEN
  if (status === "battling") {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-3 
          border-b border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="text-sm text-[var(--text-secondary)]">
            Round <span className="text-[var(--text-primary)] font-bold">
              {currentRound}
            </span> of {totalRounds}
          </div>
          <div className="font-medium text-[var(--text-primary)] text-sm">
            {topic}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-green-400 font-bold">
              {forModel.avatar} {totalScores.for}
            </span>
            <span className="text-[var(--text-muted)]">vs</span>
            <span className="text-red-400 font-bold">
              {totalScores.against} {againstModel.avatar}
            </span>
          </div>
        </div>

        {/* Battle Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* FOR Panel */}
          <div className="flex-1 p-5 border-r border-[var(--border)] overflow-y-auto
            bg-green-500/5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{forModel.avatar}</span>
              <div>
                <div className="font-medium text-[var(--text-primary)] text-sm">
                  {forModel.name}
                </div>
                <div className="text-xs text-green-400 font-bold">FOR</div>
              </div>
            </div>
            {thinkingFor && (
              <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }} />
                </div>
                Thinking...
              </div>
            )}
            {currentForArg && (
              <TypewriterText
                text={currentForArg}
                speed={15}
                className="text-[var(--text-primary)] text-sm leading-relaxed"
              />
            )}
          </div>

          {/* AGAINST Panel */}
          <div className="flex-1 p-5 overflow-y-auto bg-red-500/5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{againstModel.avatar}</span>
              <div>
                <div className="font-medium text-[var(--text-primary)] text-sm">
                  {againstModel.name}
                </div>
                <div className="text-xs text-red-400 font-bold">AGAINST</div>
              </div>
            </div>
            {thinkingAgainst && (
              <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }} />
                </div>
                Thinking...
              </div>
            )}
            {currentAgainstArg && (
              <TypewriterText
                text={currentAgainstArg}
                speed={15}
                className="text-[var(--text-primary)] text-sm leading-relaxed"
              />
            )}
          </div>
        </div>

        {/* Round Verdict */}
        {currentRoundData && (
          <div className="px-6 py-4 border-t border-[var(--border)] 
            bg-[var(--bg-elevated)]">
            <div className="flex items-center justify-between">
              <div className="text-xs text-[var(--text-secondary)]">
                {forModel.name}: {currentRoundData.forFeedback}
              </div>
              <div className="px-4 py-1 rounded-full text-xs font-bold
                bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]">
                Round {currentRound} Winner: {
                  currentRoundData.roundWinner === 'for' ? forModel.name :
                    currentRoundData.roundWinner === 'against' ? againstModel.name :
                      'Draw'
                }
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                {againstModel.name}: {currentRoundData.againstFeedback}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // FINISHED SCREEN
  const winner = getWinner();
  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 max-w-3xl mx-auto">
      {/* Winner Banner */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-3xl font-bold font-display text-[var(--text-primary)] mb-2">
          {winner ? `${winner.avatar} ${winner.name} Wins!` : "🤝 It's a Draw!"}
        </h2>
        <p className="text-[var(--text-secondary)]">&quot;{topic}&quot;</p>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">
              {totalScores.for}
            </div>
            <div className="text-sm text-[var(--text-secondary)]">
              {forModel.avatar} {forModel.name}
            </div>
          </div>
          <div className="text-[var(--text-muted)]">vs</div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-400">
              {totalScores.against}
            </div>
            <div className="text-sm text-[var(--text-secondary)]">
              {againstModel.avatar} {againstModel.name}
            </div>
          </div>
        </div>
      </div>

      {/* ScoreBoard */}
      <ScoreBoard forScore={totalScores.for} againstScore={totalScores.against} />

      {/* Round Breakdown */}
      <div className="mb-8 space-y-3">
        <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase 
          tracking-wider mb-4">
          Round Breakdown
        </h3>
        {rounds.map((r, i) => (
          <div key={i} className="p-4 rounded-xl bg-[var(--bg-card)] 
            border border-[var(--border)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[var(--text-muted)] uppercase">
                Round {r.round} — {r.roundType}
              </span>
              <span className="text-xs font-bold text-[var(--accent-primary)]">
                Winner: {
                  r.roundWinner === 'for' ? forModel.name :
                    r.roundWinner === 'against' ? againstModel.name : 'Draw'
                }
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-green-400 mb-1">
                  {forModel.name}: {r.forScore}/10
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  {r.forFeedback}
                </p>
              </div>
              <div>
                <div className="text-xs text-red-400 mb-1">
                  {againstModel.name}: {r.againstScore}/10
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  {r.againstFeedback}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            setStatus("idle"); setRounds([]);
            setTotalScores({ for: 0, against: 0 });
          }}
          className="flex-1 flex items-center justify-center gap-2 py-3 
            rounded-xl border border-[var(--border)] 
            text-[var(--text-secondary)] hover:border-[var(--accent-primary)]
            hover:text-[var(--accent-primary)] transition-all"
        >
          <RotateCcw size={16} /> Rematch
        </button>
        <button
          onClick={reset}
          className="flex-1 flex items-center justify-center gap-2 py-3
            rounded-xl border border-[var(--border)]
            text-[var(--text-secondary)] hover:border-[var(--accent-primary)]
            hover:text-[var(--accent-primary)] transition-all"
        >
          <Swords size={16} /> New Battle
        </button>
        <button
          onClick={shareResult}
          className="flex-1 flex items-center justify-center gap-2 py-3
            rounded-xl bg-[var(--accent-primary)]/10 
            border border-[var(--accent-primary)]/30
            text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20
            transition-all font-medium"
        >
          <Share2 size={16} /> Share
        </button>
      </div>
    </div>
  );
}
