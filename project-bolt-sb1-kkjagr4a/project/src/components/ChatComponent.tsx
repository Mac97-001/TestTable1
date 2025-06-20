import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, ChevronLeft, Bot, User, AlertCircle, Settings, AlertTriangle } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatComponentProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  apiStatus: 'configured' | 'not_configured' | 'quota_exceeded';
}

export const ChatComponent: React.FC<ChatComponentProps> = ({
  messages,
  onSendMessage,
  isOpen,
  onToggle,
  apiStatus
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeyInfo, setShowApiKeyInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() && !isLoading) {
      setIsLoading(true);
      onSendMessage(input.trim());
      setInput('');
      // Reset loading state after a delay to show the thinking state
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getStatusInfo = () => {
    switch (apiStatus) {
      case 'configured':
        return {
          text: 'Powered by ChatGPT',
          color: 'text-blue-100',
          indicatorColor: 'bg-green-500'
        };
      case 'quota_exceeded':
        return {
          text: 'Quota Exceeded',
          color: 'text-blue-100',
          indicatorColor: 'bg-red-500'
        };
      default:
        return {
          text: 'Fallback Mode',
          color: 'text-blue-100',
          indicatorColor: 'bg-orange-500'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed right-6 bottom-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-full shadow-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 z-50 group"
        >
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
          {apiStatus !== 'configured' && (
            <div className={`absolute -top-1 -right-1 w-3 h-3 ${statusInfo.indicatorColor} rounded-full animate-pulse`} />
          )}
        </button>
      )}

      {/* Chat Sidebar */}
      <div className={`fixed right-0 top-0 h-full w-96 bg-white/95 backdrop-blur-md shadow-2xl border-l border-white/20 transform transition-transform duration-300 z-40 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">AI Table Assistant</h3>
              <p className={`text-xs ${statusInfo.color}`}>
                {statusInfo.text}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowApiKeyInfo(!showApiKeyInfo)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="API Configuration"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onToggle}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* API Key Info */}
        {showApiKeyInfo && (
          <div className={`p-4 border-b ${
            apiStatus === 'configured' ? 'bg-green-50 border-green-200' :
            apiStatus === 'quota_exceeded' ? 'bg-red-50 border-red-200' :
            'bg-orange-50 border-orange-200'
          }`}>
            <div className="flex items-start gap-3">
              {apiStatus === 'configured' ? (
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              ) : apiStatus === 'quota_exceeded' ? (
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="text-sm">
                {apiStatus === 'configured' ? (
                  <div>
                    <p className="font-medium text-green-800">OpenAI API Connected</p>
                    <p className="text-green-600 mt-1">Enhanced AI capabilities enabled with natural language understanding.</p>
                  </div>
                ) : apiStatus === 'quota_exceeded' ? (
                  <div>
                    <p className="font-medium text-red-800">OpenAI API Quota Exceeded</p>
                    <p className="text-red-600 mt-1">
                      Your API key has exceeded its usage quota. Using fallback mode with basic commands.
                    </p>
                    <div className="mt-2">
                      <a 
                        href="https://platform.openai.com/account/billing" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs text-red-600 underline font-medium"
                      >
                        Check your billing dashboard →
                      </a>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-orange-800">OpenAI API Not Configured</p>
                    <p className="text-orange-600 mt-1">
                      Using fallback mode with basic commands. To enable ChatGPT:
                    </p>
                    <ol className="text-orange-600 mt-2 text-xs space-y-1 ml-4 list-decimal">
                      <li>Get API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI</a></li>
                      <li>Copy .env.example to .env</li>
                      <li>Add your API key to .env file</li>
                      <li>Restart the development server</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100vh-140px)]">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm mb-4">Hi! I'm your AI assistant. I can help you:</p>
              
              {apiStatus === 'configured' ? (
                <div className="text-xs space-y-2 text-left max-w-xs mx-auto">
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="font-medium text-green-800 mb-2">✨ Enhanced AI Mode</p>
                    <p className="text-green-600">Use natural language commands like:</p>
                    <ul className="mt-2 space-y-1 text-green-600">
                      <li>• "Make all values in row 1 equal to 50"</li>
                      <li>• "Add a new column called 'Prices'"</li>
                      <li>• "Delete the second row"</li>
                      <li>• "Fill column 2 with random numbers"</li>
                    </ul>
                  </div>
                </div>
              ) : apiStatus === 'quota_exceeded' ? (
                <div className="text-xs space-y-2 text-left max-w-xs mx-auto">
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <p className="font-medium text-red-800 mb-2">⚠️ Quota Exceeded</p>
                    <p className="text-red-600 mb-2">Using basic commands only:</p>
                    <ul className="text-red-600 space-y-1">
                      <li>• "add row 10, 20, 30"</li>
                      <li>• "set row 1 col 2 to 50"</li>
                      <li>• "delete row 2"</li>
                      <li>• "add column"</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <ul className="text-xs mt-2 space-y-1 text-left max-w-xs mx-auto">
                  <li>• Add rows: "add row 10, 20, 30"</li>
                  <li>• Edit cells: "set row 1 col 2 to 50"</li>
                  <li>• Delete rows: "delete row 2"</li>
                  <li>• Add columns: "add column"</li>
                </ul>
              )}
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.sender === 'ai' && (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white ml-8'
                      : 'bg-gray-100 text-gray-800 mr-8'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {message.sender === 'user' && (
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))
          )}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
              <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl mr-8">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {apiStatus === 'configured' ? 'ChatGPT is thinking...' : 'Processing...'}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={apiStatus === 'configured' ? "Ask me anything about the table..." : 
                          apiStatus === 'quota_exceeded' ? "Use basic commands (quota exceeded)..." :
                          "Type a command..."}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          onClick={onToggle}
        />
      )}
    </>
  );
};