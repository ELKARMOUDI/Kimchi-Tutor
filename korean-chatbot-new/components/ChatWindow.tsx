import { useState, useRef, useEffect, useMemo } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';
import Link from "next/link";

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
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
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

const generateTitle = (firstMessage: string) => {
  return firstMessage.length > 20 
    ? `${firstMessage.substring(0, 20)}...` 
    : firstMessage || 'New Chat';
};

const parseSavedChats = (savedChats: string | null): ChatSession[] => {
  if (!savedChats) return [];
  
  try {
    const parsed = JSON.parse(savedChats, (key, value) => {
      if ((key.endsWith('At') || key === 'timestamp') && typeof value === 'string') {
        return new Date(value);
      }
      return value;
    });
    
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse saved chats:', error);
    return [];
  }
};

export default function ChatWindow() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    const defaultSession = {
      id: uuidv4(),
      title: 'New Chat',
      lastMessage: '',
      timestamp: new Date(),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const saved = localStorage.getItem('chatSessions');
    const parsed = parseSavedChats(saved);
    return parsed.length > 0 ? parsed : [defaultSession];
  });

  const [currentSession, setCurrentSession] = useState<string | null>(chatSessions[0]?.id || null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const currentMessages = useMemo(() => {
    if (!currentSession) return [];
    const session = chatSessions.find(s => s.id === currentSession);
    return session?.messages || [];
  }, [currentSession, chatSessions]);

  // Save chats when they change
  useEffect(() => {
    try {
      localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
    } catch (error) {
      console.error('Failed to save chat sessions:', error);
    }
  }, [chatSessions]);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const startNewChat = () => {
    const newSessionId = uuidv4();
    const newSession = {
      id: newSessionId,
      title: 'New Chat',
      lastMessage: '',
      timestamp: new Date(),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setCurrentSession(newSessionId);
    setChatSessions(prev => [newSession, ...prev]);
    setInputValue('');
    setIsSidebarOpen(false);
  };

  const loadChat = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(sessionId);
      setIsSidebarOpen(false);
    }
  };

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSessions = chatSessions.filter(s => s.id !== sessionId);
    
    if (newSessions.length === 0) {
      startNewChat();
      return;
    }

    setChatSessions(newSessions);
    
    if (currentSession === sessionId) {
      setCurrentSession(newSessions[0].id);
    }
  };
   
  const sendMessage = async () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || trimmedValue.length > 1000) return;
    const needsRomanization = shouldRomanize(trimmedValue);

    const userMessage: Message = {
      id: uuidv4(),
      content: trimmedValue,
      role: 'user',
      timestamp: new Date(),
    };

    const updatedMessages = [...currentMessages, userMessage];
    setInputValue('');
    setIsLoading(true);

    setChatSessions(prev => 
      prev.map(session => 
        session.id === currentSession
          ? { 
              ...session, 
              lastMessage: trimmedValue,
              title: session.title === 'New Chat' ? generateTitle(trimmedValue) : session.title,
              messages: updatedMessages,
              updatedAt: new Date()
            }
          : session
      )
    );

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: trimmedValue,
          romanize: needsRomanization
        }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      
      const botMessage: Message = {
        id: uuidv4(),
        content: data.reply,
        role: 'assistant',
        timestamp: new Date(),
      };
      
      const completeMessages = [...updatedMessages, botMessage];

      setChatSessions(prev => 
        prev.map(session => 
          session.id === currentSession
            ? { 
                ...session, 
                lastMessage: data.reply,
                messages: completeMessages,
                updatedAt: new Date()
              }
            : session
        )
      );
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: uuidv4(),
        content: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        role: 'assistant',
        timestamp: new Date(),
      };
      
      const errorMessages = [...updatedMessages, errorMessage];
      
      setChatSessions(prev => 
        prev.map(session => 
          session.id === currentSession
            ? { 
                ...session, 
                lastMessage: 'Error occurred',
                messages: errorMessages,
                updatedAt: new Date()
              }
            : session
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">
      {/* Sidebar - Hidden by default on all screens */}
      <div
        ref={sidebarRef}
        className={`fixed z-20 w-64 bg-gray-800 border-r border-gray-700 flex flex-col transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ height: '100vh' }}
      >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Chat History</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700"
            aria-label="Close sidebar"
          >
            <FiX size={24} />
          </button>
        </div>
        <div className="p-4 border-b border-gray-700">
          <button 
            onClick={startNewChat}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            aria-label="Start new chat"
          >
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chatSessions.map(session => (
            <div
              key={session.id}
              onClick={() => loadChat(session.id)}
              className={`p-3 border-b border-gray-700 cursor-pointer hover:bg-gray-700 relative ${
                currentSession === session.id ? 'bg-gray-700' : ''
              }`}
              aria-current={currentSession === session.id ? 'true' : 'false'}
            >
              <button
                onClick={(e) => deleteSession(session.id, e)}
                className="absolute right-2 top-2 text-gray-400 hover:text-red-400"
                aria-label={`Delete chat ${session.title}`}
              >
                ×
              </button>
              <div className="font-medium truncate pr-6">
                {session.title}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {session.lastMessage || 'No messages yet'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(session.updatedAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overlay - Only shows when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
   
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col w-full">
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 shadow-lg">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-white hover:text-blue-200 transition-colors"
                aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
              
              {/* Cute Robot Logo */}
              <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <div className="relative">
                  {/* Robot Head */}
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                    {/* Robot Face */}
                    <div className="relative">
                      {/* Eyes */}
                      <div className="flex space-x-2 mb-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                      {/* Mouth */}
                      <div className="w-4 h-1 bg-blue-600 rounded-full mx-auto"></div>
                    </div>
                    {/* Antenna */}
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <div className="w-1 h-2 bg-blue-400 rounded-t-full"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full -mt-1 mx-auto"></div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    Kimchi Tutor
                  </h1>
                  <p className="text-xs text-blue-200 font-medium tracking-wider">
                    POCKET BUDDY
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </header>
          
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                <div className="text-2xl mb-2">🇰🇷</div>
                <h2 className="text-xl font-medium">한국어 연습을 시작해보세요!</h2>
                <p className="mt-1">Send a message to begin practicing Korean</p>
              </div>
            </div>
          ) : (
            currentMessages.map(message => (
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
                  <div className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}

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

        <div className="bg-gray-800 border-t border-gray-700 p-4">
          <div className="flex items-center space-x-2 max-w-4xl mx-auto">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
              placeholder="메시지를 입력하세요..."
              className="flex-1 bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
              aria-label="Message input"
              maxLength={1000}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              보내기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}