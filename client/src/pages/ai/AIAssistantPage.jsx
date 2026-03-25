import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, Copy, Check, Loader2, BookOpen, ClipboardList, FileQuestion } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';

const presets = [
  { icon: FileQuestion, label: 'Generate Quiz', prompt: 'Generate 5 quiz questions about ', color: 'bg-primary/10 text-primary' },
  { icon: BookOpen, label: 'Summarize Notes', prompt: 'Summarize the following lecture notes:\n', color: 'bg-accent/10 text-accent' },
  { icon: ClipboardList, label: 'Create Rubric', prompt: 'Create a grading rubric for ', color: 'bg-success/10 text-success' },
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');

  const sendMessage = async (text) => {
    const prompt = text || input;
    if (!prompt.trim()) return;
    const userMsg = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const isQuiz = prompt.toLowerCase().includes('quiz') || prompt.toLowerCase().includes('question');
      let aiContent;
      if (isQuiz) {
        const { data } = await api.post('/ai/generate-quiz', { topic: prompt, numQuestions: 5 });
        aiContent = data.quiz.map((q, i) =>
          `**Q${i + 1}: ${q.question}**\n${q.options.map((o, j) => `${['A', 'B', 'C', 'D'][j]}. ${o}`).join('\n')}\n✅ Answer: ${['A', 'B', 'C', 'D'][q.correctAnswer]}\n💡 ${q.explanation}`
        ).join('\n\n---\n\n');
      } else {
        const { data } = await api.post('/ai/summarize', { content: prompt });
        aiContent = data.summary;
      }
      setMessages(prev => [...prev, { role: 'ai', content: aiContent }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: '❌ Error: ' + (err.response?.data?.message || 'Something went wrong') }]);
    }
    setLoading(false);
  };

  const copyContent = (content) => {
    navigator.clipboard.writeText(content);
    setCopied(content);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold dark:text-text-dark flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" /> AI Assistant
        </h1>
        <p className="text-text-muted">Generate quizzes, summarize lectures, and create rubrics</p>
      </div>

      {/* Presets */}
      <div className="flex gap-3 flex-wrap">
        {presets.map(({ icon: Icon, label, prompt, color }) => (
          <button key={label} onClick={() => setInput(prompt)}
            className={`${color} px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:opacity-80 transition-opacity`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div className="glass-card p-6 min-h-[400px] flex flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto mb-4 max-h-[500px]">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold dark:text-text-dark">AI Teaching Assistant</h3>
              <p className="text-sm text-text-muted mt-2 max-w-md mx-auto">
                Ask me to generate quiz questions, summarize lecture notes, or create grading rubrics.
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'gradient-primary text-white rounded-tr-sm'
                  : 'bg-muted dark:bg-muted-dark dark:text-text-dark rounded-tl-sm'
              }`}>
                <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                {msg.role === 'ai' && (
                  <button onClick={() => copyContent(msg.content)}
                    className="mt-2 text-xs text-text-muted hover:text-primary flex items-center gap-1">
                    {copied === msg.content ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted dark:bg-muted-dark p-4 rounded-2xl rounded-tl-sm">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-3">
          <textarea value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            rows={2} placeholder="Ask AI to generate quiz, summarize notes..."
            className="flex-1 px-4 py-3 bg-muted dark:bg-muted-dark rounded-xl text-sm border border-border dark:border-border-dark outline-none focus:ring-2 focus:ring-primary/30 resize-none dark:text-text-dark" />
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
            className="px-5 gradient-primary text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 self-end">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
