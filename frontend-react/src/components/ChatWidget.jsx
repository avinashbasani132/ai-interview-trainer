import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, X, Minus, Settings, Trash2, Send, Mic, Paperclip, 
  Sparkles, ChevronRight 
} from 'lucide-react';

import { api } from '../services/api';
import { marked } from 'marked';

const QUICK_ACTIONS = [
  { label: '📄 Analyze Resume', prompt: 'Please analyze my resume and give detailed feedback on strengths, weaknesses, and improvements.' },
  { label: '📊 ATS Score', prompt: 'Help me improve my ATS score. What keywords am I missing and how can I optimize my resume?' },
  { label: '🎯 Mock Interview', prompt: 'Start a mock interview with me. Act as an interviewer, ask one question at a time, evaluate my answer, then ask the next.' },
  { label: '💻 Coding Help', prompt: 'Help me with coding problems. I want to practice DSA, algorithms, and data structures.' },
  { label: '🚀 Career Advice', prompt: 'Give me personalized career advice. What should I focus on to get my dream job?' },
  { label: '👔 HR Questions', prompt: 'Generate common HR interview questions and help me prepare strong answers.' },
  { label: '⚙️ Technical Q&A', prompt: 'Ask me technical interview questions for a software engineering role one by one.' },
  { label: '🗺️ Roadmap', prompt: 'Create a detailed, personalized learning roadmap for me based on my current skill level.' },
  { label: '🧠 DSA Help', prompt: 'Help me with Data Structures and Algorithms. Explain concepts clearly and give me practice problems.' },
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  
  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [minimized, setMinimized] = useState(false);

  // Voice/Attachment
  const [isListening, setIsListening] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedText, setAttachedText] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize and load chat history
  useEffect(() => {
    if (isOpen) {
      loadHistory();
      loadSuggestions();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadHistory = async () => {
    try {
      const data = await api.getChatHistory();
      setMessages(data.history || []);
    } catch (e) {
      console.error('History load error:', e);
    }
  };

  const loadSuggestions = async () => {
    try {
      const data = await api.getChatSuggestions();
      setSuggestions(data.suggestions || []);
    } catch (e) {
      console.error('Suggestions load error:', e);
    }
  };

  // TTS Helper
  const speak = (text) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    const cleanText = text
      .replace(/[#*`~_]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/<[^>]+>/g, '')
      .trim();
    if (!cleanText) return;
    const utterance = new SpeechSynthesisUtterance(cleanText.slice(0, 500));
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textToSend = inputText) => {
    const text = textToSend.trim();
    if (!text && !attachedFile) return;

    const userMessage = { role: 'user', content: text || `Attached file: ${attachedFile.name}` };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const extraContext = {};
      if (attachedFile) {
        extraContext.resume_name = attachedFile.name;
        extraContext.resume_text = attachedText;
      }

      const response = await api.sendChatMessage(text || `Uploaded: ${attachedFile.name}`, extraContext);
      
      const assistantMessage = { role: 'assistant', content: response.response };
      setMessages(prev => [...prev, assistantMessage]);

      if (ttsEnabled) {
        speak(response.response);
      }
      
      // Clear file attachment after sending
      setAttachedFile(null);
      setAttachedText('');
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, there was an error processing your request: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (window.confirm('Are you sure you want to clear chat history?')) {
      try {
        await api.clearChatHistory();
        setMessages([]);
        loadSuggestions();
      } catch (e) {
        console.error('Clear chat error:', e);
      }
    }
  };

  // Voice Speech-to-Text
  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onresult = (e) => {
      const resultText = e.results[0][0].transcript;
      setInputText(prev => prev ? prev + ' ' + resultText : resultText);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // File Upload Handlers
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) attachFile(file);
  };

  const attachFile = (file) => {
    setAttachedFile(file);
    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (event) => setAttachedText(event.target.result);
      reader.readAsText(file);
    } else {
      setAttachedText('[Binary file content not parsed locally]');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      attachFile(e.dataTransfer.files[0]);
    }
  };

  const handleQuickAction = (prompt) => {
    handleSend(prompt);
  };

  return (
    <div id="chat-widget" className="relative z-50">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 text-white shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/30"
          title="AI Career Assistant"
        >
          <MessageSquare className="w-7 h-7" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          onDragEnter={handleDrag}
          className={`fixed bottom-24 right-6 flex flex-col overflow-hidden bg-slate-950/95 border border-indigo-500/20 shadow-2xl rounded-2xl transition-all duration-300 ${
            minimized ? 'h-[58px]' : compactMode ? 'h-[420px]' : 'h-[520px]'
          } ${compactMode ? 'w-[330px]' : 'w-[360px]'}`}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-gradient-to-r from-blue-900/80 to-indigo-900/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-sm">🤖</div>
              <div>
                <p className="text-white font-bold text-sm">AI Career Assistant</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <p className="text-slate-400 text-[10px]">Online · Gemini AI</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowSettings(!showSettings)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <Settings className="w-4 h-4" />
              </button>
              <button onClick={clearHistory} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={() => setMinimized(!minimized)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <Minus className="w-4 h-4" />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && !minimized && (
            <div className="flex-shrink-0 px-4 py-3 bg-slate-900 border-b border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>🔊 Text-to-Speech</span>
                <button
                  onClick={() => {
                    setTtsEnabled(!ttsEnabled);
                    if (ttsEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
                  }}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors ${ttsEnabled ? 'bg-indigo-600' : 'bg-slate-700'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${ttsEnabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </button>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>📐 Compact Mode</span>
                <button
                  onClick={() => setCompactMode(!compactMode)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors ${compactMode ? 'bg-indigo-600' : 'bg-slate-700'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${compactMode ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </button>
              </div>
            </div>
          )}

          {/* Drag & Drop Overlay */}
          {dragActive && (
            <div className="absolute inset-0 bg-indigo-600/15 backdrop-blur-sm border-2 border-dashed border-indigo-500 z-55 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-5xl mb-3">📄</span>
              <p className="text-indigo-300 font-bold text-sm">Drop your Resume here</p>
              <p className="text-slate-400 text-xs mt-1">PDF or Plain Text files supported</p>
            </div>
          )}

          {!minimized && (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-10">
                    <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-60" />
                    <p className="text-slate-400 text-xs">How can I help you with your career prep today?</p>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {m.role !== 'user' && (
                        <div className="w-6 h-6 rounded-full bg-indigo-500/25 border border-indigo-500/30 flex items-center justify-center text-xs flex-shrink-0">🤖</div>
                      )}
                      <div
                        className={`max-w-[75%] px-3 py-2 text-xs leading-normal ${
                          m.role === 'user'
                            ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm'
                            : 'bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm text-slate-300'
                        }`}
                        dangerouslySetInnerHTML={{ __html: marked.parse(m.content) }}
                      ></div>
                    </div>
                  ))
                )}

                {loading && (
                  <div className="flex gap-2.5 justify-start">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/25 border border-indigo-500/30 flex items-center justify-center text-xs flex-shrink-0">🤖</div>
                    <div className="px-3 py-2 rounded-2xl rounded-tl-sm bg-slate-900 border border-slate-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="px-4 pb-2 flex-shrink-0 bg-slate-950/60">
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Personalized Suggestions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickAction(s)}
                        className="text-[10px] bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-indigo-300 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <ChevronRight className="w-3 h-3 text-indigo-400" />
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Chips */}
              <div className="px-4 pb-2 flex-shrink-0 bg-slate-950/60 overflow-x-auto whitespace-nowrap scrollbar-none py-1">
                <div className="flex gap-1.5">
                  {QUICK_ACTIONS.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickAction(action.prompt)}
                      className="text-[10px] bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 px-2.5 py-1.5 rounded-lg transition-colors inline-block"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="p-3 border-t border-slate-900 bg-slate-950 flex-shrink-0">
                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {attachedFile && (
                  <div className="mb-2 bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between px-3 py-1.5 rounded-xl text-xs text-indigo-300">
                    <span className="truncate flex-1">📄 {attachedFile.name}</span>
                    <button onClick={() => setAttachedFile(null)} className="text-slate-400 hover:text-red-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={isListening ? stopVoiceInput : startVoiceInput}
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors ${
                      isListening ? 'bg-red-500/20 border-red-500/60 text-red-500' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
                    title="Attach Resume Context"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask anything about your career..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500/60"
                  />
                  <button
                    onClick={() => handleSend()}
                    className="w-8 h-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
