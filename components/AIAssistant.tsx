
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, WikiArticle, School, Citation } from '../types';
import { chatWithKnowledgeBase } from '../services/geminiService';
import { Send, Bot, User as UserIcon, Loader2, Sparkles, BookOpen, School as SchoolIcon, ThumbsUp, ThumbsDown, AlertCircle, HelpCircle, X, MapPin, DollarSign, Book } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIAssistantProps {
  wikiArticles: WikiArticle[];
  schools: School[];
}

const SUGGESTED_QUESTIONS = [
  "什麼是 STEM OPT？申請資格為何？",
  "如何回答家長覺得代辦費太貴的問題？",
  "University of Washington 的入學要求是什麼？",
  "英國 ATAS 認證需要準備什麼文件？",
];

const AIAssistant: React.FC<AIAssistantProps> = ({ wikiArticles, schools }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: '你好！我是 FangYang Nexus 智能助教。\n我可以協助你查詢學校資料、解釋專有名詞（如 ATAS, STEM）或是提供銷售話術建議。\n\n請直接提問，或選擇下方的常見問題。',
      timestamp: new Date(),
      confidence: 'HIGH'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Citation Preview State
  const [previewItem, setPreviewItem] = useState<{ type: 'SCHOOL' | 'WIKI', data: School | WikiArticle } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const schoolContext = schools.map(s => 
      `[ID: ${s.id}, Type: SCHOOL] Name: ${s.name}, Country: ${s.country}, Location: ${s.location}, Programs: ${s.programs.join(', ')}, Tuition: ${s.tuitionRange}, Req: ${JSON.stringify(s.requirements)}, Tags: ${s.tags.join(', ')}`
    ).join('\n');
    
    const wikiContext = wikiArticles.map(w => 
      `[ID: ${w.id}, Type: WIKI] Title: ${w.title}, Category: ${w.category}, Content: ${w.content.replace(/\n+/g, ' ')}`
    ).join('\n');

    const fullContext = `
      === SCHOOL DATABASE ===
      ${schoolContext}

      === WIKI ARTICLES ===
      ${wikiContext}
    `;

    try {
      const response = await chatWithKnowledgeBase(userMsg.text, fullContext);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.answer,
        sources: response.sources,
        confidence: response.confidence,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: '抱歉，連線發生錯誤，請稍後再試。',
        timestamp: new Date(),
        confidence: 'LOW'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Check if the user is composing via IME (e.g., Chinese input)
    // If composing, we do NOT want to send the message on Enter
    if (e.key === 'Enter' && !e.shiftKey && !(e.nativeEvent as any).isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFeedback = (msgId: string, type: 'positive' | 'negative') => {
    setMessages(prev => prev.map(msg => 
      msg.id === msgId ? { ...msg, feedback: type } : msg
    ));
  };

  const handleCitationClick = (citation: Citation) => {
    if (citation.type === 'SCHOOL') {
      // Find school by ID, or fallback to fuzzy name match if ID fails (though ID should work)
      const school = schools.find(s => s.id === citation.id) || schools.find(s => s.name === citation.title);
      if (school) {
        setPreviewItem({ type: 'SCHOOL', data: school });
      } else {
        alert("找不到原始資料 (可能已被刪除)");
      }
    } else {
      const wiki = wikiArticles.find(w => w.id === citation.id) || wikiArticles.find(w => w.title === citation.title);
      if (wiki) {
        setPreviewItem({ type: 'WIKI', data: wiki });
      } else {
        alert("找不到原始資料 (可能已被刪除)");
      }
    }
  };

  const renderConfidenceBadge = (confidence?: 'HIGH' | 'MEDIUM' | 'LOW') => {
    if (!confidence) return null;
    
    let color = 'bg-gray-100 text-gray-600';
    let icon = <HelpCircle size={12} />;
    let text = '未知信心';

    if (confidence === 'HIGH') {
      color = 'bg-green-100 text-green-700 border-green-200';
      icon = <Sparkles size={12} />;
      text = '高可信度';
    } else if (confidence === 'MEDIUM') {
      color = 'bg-yellow-50 text-yellow-700 border-yellow-200';
      icon = <AlertCircle size={12} />;
      text = '一般可信度';
    } else {
      color = 'bg-red-50 text-red-600 border-red-200';
      icon = <AlertCircle size={12} />;
      text = '低可信度 - 建議人工查核';
    }

    return (
      <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${color} font-medium`}>
        {icon} {text}
      </span>
    );
  };

  return (
    <div className="h-screen pt-4 pb-8 px-4 flex flex-col max-w-5xl mx-auto relative">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <Bot size={24} className="text-[#FF4B7D]" />
            </div>
            <div>
              <h2 className="font-bold text-lg">員工知識庫助理</h2>
              <p className="text-xs text-gray-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                Online | 連結至內部資料庫
              </p>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#F8FAFC]">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${isUser ? 'bg-slate-700 text-white' : 'bg-white text-[#FF4B7D] border border-gray-100'}`}>
                  {isUser ? <UserIcon size={20} /> : <Sparkles size={20} />}
                </div>
                
                <div className={`flex flex-col gap-2 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className={`p-5 rounded-2xl text-sm leading-relaxed shadow-sm overflow-hidden prose prose-sm max-w-none ${
                    isUser 
                      ? 'bg-slate-700 text-white rounded-tr-none prose-invert' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none prose-slate'
                  } prose-p:my-1 prose-headings:my-2 prose-ul:my-1`}>
                    <ReactMarkdown>
                      {msg.text}
                    </ReactMarkdown>
                  </div>

                  {/* AI Message Footer: Sources & Confidence */}
                  {!isUser && (
                    <div className="flex flex-col gap-2 w-full">
                      {/* Sources */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {msg.sources.map((source, idx) => (
                            <div 
                              key={idx} 
                              onClick={() => handleCitationClick(source)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 hover:border-[#FF4B7D] hover:text-[#FF4B7D] hover:shadow-md transition-all cursor-pointer shadow-sm group"
                            >
                              {source.type === 'SCHOOL' ? <SchoolIcon size={12} /> : <BookOpen size={12} />}
                              <span className="font-medium max-w-[150px] truncate">{source.title}</span>
                              <div className="w-1.5 h-1.5 bg-[#FF4B7D] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Meta: Timestamp, Confidence, Feedback */}
                      <div className="flex items-center justify-between px-1 w-full">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-gray-400">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {renderConfidenceBadge(msg.confidence)}
                        </div>
                        
                        {msg.role === 'model' && msg.id !== 'welcome' && (
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleFeedback(msg.id, 'positive')}
                              className={`p-1 rounded hover:bg-gray-100 transition-colors ${msg.feedback === 'positive' ? 'text-green-600' : 'text-gray-300'}`}
                            >
                              <ThumbsUp size={14} />
                            </button>
                            <button 
                              onClick={() => handleFeedback(msg.id, 'negative')}
                              className={`p-1 rounded hover:bg-gray-100 transition-colors ${msg.feedback === 'negative' ? 'text-red-500' : 'text-gray-300'}`}
                            >
                              <ThumbsDown size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-white border border-gray-100 text-[#FF4B7D] flex items-center justify-center shadow-sm">
                <Loader2 size={20} className="animate-spin" />
              </div>
              <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-3">
                <span className="w-2 h-2 bg-[#FF4B7D] rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-[#FF4B7D] rounded-full animate-bounce delay-75"></span>
                <span className="w-2 h-2 bg-[#FF4B7D] rounded-full animate-bounce delay-150"></span>
                <span className="text-xs text-gray-400 ml-2">正在檢索知識庫與分析...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length <= 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 overflow-x-auto">
            <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">建議提問</p>
            <div className="flex gap-3">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="flex-shrink-0 px-4 py-2 bg-white border border-gray-200 hover:border-[#FF4B7D] hover:text-[#FF4B7D] text-gray-600 text-sm rounded-full transition-all shadow-sm whitespace-nowrap"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="relative flex items-end gap-2 p-2 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-[#FF4B7D] focus-within:border-[#FF4B7D] transition-all bg-white shadow-sm">
            <textarea
              className="w-full max-h-32 p-3 resize-none focus:outline-none text-sm bg-transparent placeholder-gray-400 text-gray-900"
              placeholder="請輸入您的問題（支援中英文、縮寫）..."
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <button 
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="p-3 bg-[#FF4B7D] text-white rounded-lg hover:bg-[#E63E6D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md flex-shrink-0"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-[10px] text-center text-gray-400 mt-2">
            AI 回答僅供參考，重要合約資訊請務必再次核對 <span className="underline cursor-pointer hover:text-gray-600">Wiki 合約專區</span>。
          </p>
        </div>
      </div>

      {/* --- Preview Modal --- */}
      {previewItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {previewItem.type === 'SCHOOL' ? <SchoolIcon size={20} className="text-[#FF4B7D]"/> : <BookOpen size={20} className="text-[#FF4B7D]"/>}
                {previewItem.type === 'SCHOOL' ? '學校資料預覽' : '知識庫預覽'}
              </h3>
              <button 
                onClick={() => setPreviewItem(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar bg-white">
              {previewItem.type === 'SCHOOL' ? (
                // SCHOOL PREVIEW
                <div className="space-y-6">
                  {(() => {
                    const s = previewItem.data as School;
                    return (
                      <>
                        <div className="border-b border-gray-100 pb-4 mb-4">
                          <h2 className="text-2xl font-bold text-gray-900 mb-1">{s.name}</h2>
                          <div className="flex items-center text-gray-500">
                             <MapPin size={16} className="mr-1" /> {s.location}, {s.country}
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <p className="text-sm text-gray-500 mb-1 flex items-center gap-1"><DollarSign size={14}/> Tuition</p>
                          <p className="font-bold text-gray-900">{s.tuitionRange}</p>
                        </div>

                        {s.description && (
                          <div className="prose prose-sm prose-slate max-w-none">
                            <h4 className="font-bold text-gray-900">About</h4>
                            <p>{s.description}</p>
                          </div>
                        )}

                        <div>
                          <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-1"><Book size={16}/> Programs</h4>
                          <div className="flex flex-wrap gap-2">
                            {s.programs.map(p => (
                              <span key={p} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium border border-indigo-100">{p}</span>
                            ))}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                // WIKI PREVIEW
                <div className="prose prose-slate max-w-none">
                   {(() => {
                     const w = previewItem.data as WikiArticle;
                     return (
                       <>
                         <h1 className="text-2xl font-bold text-gray-900 mb-2">{w.title}</h1>
                         <div className="text-xs text-gray-400 mb-6">Last Updated: {w.lastModified}</div>
                         <ReactMarkdown>{w.content}</ReactMarkdown>
                       </>
                     );
                   })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
