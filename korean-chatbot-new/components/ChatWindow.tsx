import { useState, useEffect } from 'react';
import Message from './Message';
import TypingIndicator from './TypingIndicator';
import { PaperAirplaneIcon, MicrophoneIcon, QuestionMarkCircleIcon } from './Icons';

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  type Message = {
    id: number;
    sender: 'user' | 'bot';
    text: string;
    timestamp: Date;
    isError?: boolean;
  };

  // Load saved messages
  useEffect(() => {
    const saved = localStorage.getItem('koreanChatHistory');
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  // Save messages
  useEffect(() => {
    localStorage.setItem('koreanChatHistory', JSON.stringify(messages));
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg: Message = { 
      id: Date.now(),
      sender: 'user',
      text: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      
      const data = await res.json();
      setMessages(prev => [...prev, { 
        id: Date.now(),
        sender: 'bot',
        text: data.reply || "안녕하세요! 한국어 학습을 도와드릴게요.",
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error("API Error:", error);
      setMessages(prev => [...prev, { 
        id: Date.now(),
        sender: 'bot',
        text: "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.",
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
              <span className="text-blue-600 font-bold text-lg">한</span>
            </div>
            <h1 className="text-xl font-bold">한국어 학습 챗봇</h1>
          </div>
          <button className="p-2 rounded-full hover:bg-blue-500 transition-colors">
            <QuestionMarkCircleIcon className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto max-w-3xl mx-auto w-full space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            메시지를 입력하여 대화를 시작하세요
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="animate-message-pop">
            <Message 
              text={msg.text} 
              isUser={msg.sender === 'user'} 
              timestamp={msg.timestamp}
              isError={msg.isError}
            />
          </div>
        ))}
        {loading && <TypingIndicator />}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="메시지를 입력하세요..."
              className="flex-1 p-3 pr-12 border rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              disabled={loading}
            />
            <div className="absolute right-14 top-3 text-gray-400">
              <button className="hover:text-blue-500 transition-colors">
                <MicrophoneIcon className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className={`w-12 flex items-center justify-center rounded-xl transition-colors
                ${(!input.trim() || loading) 
                  ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`
              }
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
            {loading ? '응답을 기다리는 중...' : 'Enter 키로 전송'}
          </p>
        </div>
      </div>
    </div>
  );
}