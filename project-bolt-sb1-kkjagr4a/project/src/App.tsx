import React, { useState, useCallback } from 'react';
import { TableComponent } from './components/TableComponent';
import { ChatComponent } from './components/ChatComponent';
import { AIAgent } from './utils/aiAgent';
import { TableData, ChatMessage } from './types';
import { Database, Sparkles, Zap, AlertTriangle } from 'lucide-react';

function App() {
  // Initialize table data
  const [tableData, setTableData] = useState<TableData>(() => {
    const generateId = () => Math.random().toString(36).substr(2, 9);
    
    return {
      headers: ['Column A', 'Column B', 'Column C'],
      rows: [
        [
          { id: generateId(), value: 42, row: 0, col: 0 },
          { id: generateId(), value: 73, row: 0, col: 1 },
          { id: generateId(), value: 18, row: 0, col: 2 },
        ],
        [
          { id: generateId(), value: 91, row: 1, col: 0 },
          { id: generateId(), value: 35, row: 1, col: 1 },
          { id: generateId(), value: 67, row: 1, col: 2 },
        ],
        [
          { id: generateId(), value: 24, row: 2, col: 0 },
          { id: generateId(), value: 89, row: 2, col: 1 },
          { id: generateId(), value: 56, row: 2, col: 2 },
        ],
      ]
    };
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [aiAgent] = useState(() => new AIAgent());

  const handleTableDataChange = useCallback((newData: TableData) => {
    setTableData(newData);
  }, []);

  const handleSendMessage = useCallback(async (message: string) => {
    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      content: message,
      sender: 'user',
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);

    try {
      // Process AI command (now async)
      const { newData, response } = await aiAgent.processCommand(message, tableData);
      
      if (newData) {
        setTableData(newData);
      }

      const aiMessage: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        content: response,
        sender: 'ai',
        timestamp: new Date()
      };

      setTimeout(() => {
        setChatMessages(prev => [...prev, aiMessage]);
      }, 300);
    } catch (error) {
      console.error('Error processing AI command:', error);
      
      const errorMessage: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        sender: 'ai',
        timestamp: new Date()
      };

      setTimeout(() => {
        setChatMessages(prev => [...prev, errorMessage]);
      }, 300);
    }
  }, [tableData, aiAgent]);

  const toggleChat = useCallback(() => {
    setIsChatOpen(prev => !prev);
  }, []);

  const getApiStatus = () => {
    return aiAgent.getApiStatus();
  };

  const getStatusInfo = () => {
    const status = getApiStatus();
    switch (status) {
      case 'configured':
        return {
          icon: Zap,
          text: 'ChatGPT Enabled',
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        };
      case 'quota_exceeded':
        return {
          icon: AlertTriangle,
          text: 'Quota Exceeded',
          color: 'text-red-600',
          bgColor: 'bg-red-100'
        };
      default:
        return {
          icon: Sparkles,
          text: 'Fallback Mode',
          color: 'text-orange-600',
          bgColor: 'bg-orange-100'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(59 130 246 / 0.15) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }} />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl">
                <Database className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Table Demo</h1>
                <p className="text-sm text-gray-600">Interactive data table with ChatGPT assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* AI Status Indicator */}
              <div className="flex items-center gap-2 text-sm">
                <div className={`flex items-center gap-2 ${statusInfo.color}`}>
                  <StatusIcon className="w-4 h-4" />
                  <span className="font-medium">{statusInfo.text}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Sparkles className="w-4 h-4" />
                <span>Powered by Bolt.new</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Database className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Rows</p>
                  <p className="text-2xl font-bold text-gray-900">{tableData.rows.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Database className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Columns</p>
                  <p className="text-2xl font-bold text-gray-900">{tableData.headers.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${statusInfo.bgColor}`}>
                  <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">AI Status</p>
                  <p className={`text-2xl font-bold ${statusInfo.color}`}>
                    {getApiStatus() === 'configured' ? 'Enhanced' : 
                     getApiStatus() === 'quota_exceeded' ? 'Limited' : 'Basic'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* API Configuration Notice */}
          {getApiStatus() !== 'configured' && (
            <div className={`${getApiStatus() === 'quota_exceeded' ? 
              'bg-gradient-to-r from-red-50 to-pink-50 border-red-200' : 
              'bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200'
            } border rounded-xl p-6`}>
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg flex-shrink-0 ${getApiStatus() === 'quota_exceeded' ? 
                  'bg-red-100' : 'bg-orange-100'
                }`}>
                  <StatusIcon className={`w-6 h-6 ${getApiStatus() === 'quota_exceeded' ? 
                    'text-red-600' : 'text-orange-600'
                  }`} />
                </div>
                <div>
                  {getApiStatus() === 'quota_exceeded' ? (
                    <>
                      <h3 className="text-lg font-semibold text-red-800 mb-2">OpenAI API Quota Exceeded</h3>
                      <p className="text-red-700 mb-3">
                        Your OpenAI API key has exceeded its usage quota. The application is now running in fallback mode with basic pattern matching.
                      </p>
                      <div className="bg-white/60 rounded-lg p-4 text-sm">
                        <p className="font-medium text-red-800 mb-2">To restore enhanced AI capabilities:</p>
                        <ol className="text-red-700 space-y-1 list-decimal list-inside">
                          <li>Visit <a href="https://platform.openai.com/account/billing" target="_blank" rel="noopener noreferrer" className="underline font-medium">OpenAI Billing Dashboard</a></li>
                          <li>Check your usage limits and add billing information if needed</li>
                          <li>Wait for quota reset or upgrade your plan</li>
                          <li>Refresh this page once resolved</li>
                        </ol>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-orange-800 mb-2">Unlock Enhanced AI Capabilities</h3>
                      <p className="text-orange-700 mb-3">
                        Currently running in fallback mode with basic pattern matching. Configure OpenAI API to enable ChatGPT for natural language commands.
                      </p>
                      <div className="bg-white/60 rounded-lg p-4 text-sm">
                        <p className="font-medium text-orange-800 mb-2">Quick Setup:</p>
                        <ol className="text-orange-700 space-y-1 list-decimal list-inside">
                          <li>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline font-medium">OpenAI Platform</a></li>
                          <li>Copy <code className="bg-orange-100 px-1 rounded">.env.example</code> to <code className="bg-orange-100 px-1 rounded">.env</code></li>
                          <li>Add your API key to the <code className="bg-orange-100 px-1 rounded">VITE_OPENAI_API_KEY</code> variable</li>
                          <li>Restart the development server</li>
                        </ol>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Interactive Data Table</h2>
              <div className="text-sm text-gray-500">
                Click cells to edit • Use AI assistant for advanced operations
              </div>
            </div>
            
            <TableComponent 
              data={tableData} 
              onDataChange={handleTableDataChange}
            />
          </div>

          {/* Features Info */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Features Demonstrated</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800">Table Operations</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Click-to-edit cells</li>
                  <li>• Column sorting</li>
                  <li>• Advanced filtering</li>
                  <li>• Auto-save changes</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800">AI Assistant</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• {getApiStatus() === 'configured' ? 'Natural language (ChatGPT)' : 
                       getApiStatus() === 'quota_exceeded' ? 'Pattern matching (quota exceeded)' : 
                       'Pattern matching commands'}</li>
                  <li>• Add/edit/delete rows</li>
                  <li>• Column management</li>
                  <li>• Real-time responses</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800">User Experience</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Responsive design</li>
                  <li>• Smooth animations</li>
                  <li>• Accessibility support</li>
                  <li>• Modern glass-morphism</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800">Technical Stack</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• React + TypeScript</li>
                  <li>• OpenAI GPT-3.5 Turbo</li>
                  <li>• Tailwind CSS</li>
                  <li>• Vite build system</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Chat Component */}
      <ChatComponent
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        isOpen={isChatOpen}
        onToggle={toggleChat}
        apiStatus={getApiStatus()}
      />
    </div>
  );
}

export default App;