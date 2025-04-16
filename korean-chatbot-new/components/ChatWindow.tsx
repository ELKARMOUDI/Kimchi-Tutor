import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

const shouldRomanize = (message: string): boolean => {
  const romanizationTriggers = [
    'how to pronounce',
    'english letters',
    'romanization', 
    'how do you say',
    'in english'
  ];
  return romanizationTriggers.some(trigger => 
    message.toLowerCase().includes(trigger)
  );
};


export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or load chats
  useEffect(() => {
    const savedChats = localStorage.getItem('chatSessions');
    if (savedChats) {
      setChatSessions(JSON.parse(savedChats));
    }
  }, []);

  // Save chats when they change
  useEffect(() => {
    if (chatSessions.length > 0) {
      localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
    }
  }, [chatSessions]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startNewChat = () => {
    setMessages([]);
    const newSessionId = Date.now().toString();
    setCurrentSession(newSessionId);
    setChatSessions(prev => [
      {
        id: newSessionId,
        title: 'New Chat',
        lastMessage: '',
        timestamp: new Date()
      },
      ...prev
    ]);
  };

  const loadChat = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(sessionId);
      // In a real app, you would load messages from storage/API
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;
    const needsRomanization = shouldRomanize(inputValue); // ← 
 

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    // Update chat session
    if (currentSession) {
      setChatSessions(prev => 
        prev.map(session => 
          session.id === currentSession
            ? { ...session, lastMessage: inputValue }
            : session
        )
      );
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: inputValue,
          romanize: needsRomanization
        }),
      });

      const data = await response.json();
      
      const botMessage: Message = {
        id: Date.now().toString(),
        content: data.reply,
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages([...updatedMessages, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages([...updatedMessages, {
        id: Date.now().toString(),
        content: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        role: 'assistant',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <button 
            onClick={startNewChat}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chatSessions.map(session => (
            <div
              key={session.id}
              onClick={() => loadChat(session.id)}
              className={`p-3 border-b border-gray-700 cursor-pointer hover:bg-gray-700 ${
                currentSession === session.id ? 'bg-gray-700' : ''
              }`}
            >
              <div className="font-medium truncate">
                {session.title || 'New Chat'}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {session.lastMessage || 'No messages yet'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 p-4">
          <h1 className="text-xl font-semibold">한국어 챗봇 튜터</h1>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                <div className="text-2xl mb-2">🇰🇷</div>
                <h2 className="text-xl font-medium">한국어 연습을 시작해보세요!</h2>
                <p className="mt-1">Send a message to begin practicing Korean</p>
              </div>
            </div>
          )}
          
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-100'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-700 rounded-lg px-4 py-3 text-gray-300 max-w-3xl">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-gray-800 border-t border-gray-700 p-4">
          <div className="flex items-center space-x-2 max-w-4xl mx-auto">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="메시지를 입력하세요..."
              className="flex-1 bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              보내기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}