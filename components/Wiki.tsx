
import React, { useState, useRef } from 'react';
import { WikiArticle, WikiCategory } from '../types';
import { CATEGORY_LABELS } from '../constants';
import { Search, ChevronRight, FileText, Plus, Edit3, Trash2, ArrowLeft, Save, Bold, Italic, List, Heading1, Heading2, Link, Underline as UnderlineIcon, ListOrdered, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { addWikiArticle, updateWikiArticle, deleteWikiArticle } from '../services/firebase';

interface WikiProps {
  articles: WikiArticle[];
  setArticles: React.Dispatch<React.SetStateAction<WikiArticle[]>>;
}

const Wiki: React.FC<WikiProps> = ({ articles, setArticles }) => {
  const [activeCategory, setActiveCategory] = useState<WikiCategory | 'ALL'>('ALL');
  const [selectedArticle, setSelectedArticle] = useState<WikiArticle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Editing / Creating State
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Loading state for save
  const [isDeleting, setIsDeleting] = useState(false); // Loading state for delete
  const [editForm, setEditForm] = useState<Partial<WikiArticle>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredArticles = articles.filter(article => {
    const matchesCategory = activeCategory === 'ALL' || article.category === activeCategory;
    const matchesSearch = 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categories = Object.keys(CATEGORY_LABELS) as WikiCategory[];

  // --- Handlers ---

  const handleStartCreate = () => {
    setEditForm({
      title: '',
      category: WikiCategory.PROCESS,
      content: '',
      tags: []
    });
    setIsCreating(true);
    setSelectedArticle(null); // Ensure detail view is clear
    setIsEditing(true); // Reuse edit UI
  };

  const handleStartEdit = (article: WikiArticle) => {
    setEditForm(article);
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleDelete = async (articleId: string) => {
    console.log("Initiating delete for:", articleId);
    if(!window.confirm("確定要刪除此條目嗎？此動作無法復原。")) return;

    setIsDeleting(true);
    try {
      await deleteWikiArticle(articleId);
      // Update local state
      setArticles(prev => prev.filter(a => a.id !== articleId));
      // Reset view
      setSelectedArticle(null);
      setIsEditing(false);
    } catch (e) {
      console.error("Delete failed:", e);
      alert("刪除失敗，請檢查網路連線或確認您有權限執行此動作。");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!editForm.title || !editForm.content) {
      alert("標題與內容為必填");
      return;
    }

    setIsSaving(true);

    const tagsArray = typeof editForm.tags === 'string' 
      ? (editForm.tags as string).split(',').map((s:string) => s.trim()) 
      : (editForm.tags || []);
    
    const timestamp = new Date().toISOString().split('T')[0];

    try {
      if (isCreating) {
        // Prepare data without ID for Firebase
        const newArticleData = {
          title: editForm.title,
          category: editForm.category || WikiCategory.PROCESS,
          content: editForm.content,
          tags: tagsArray,
          lastModified: timestamp
        };

        // Save to Firebase
        const newId = await addWikiArticle(newArticleData);

        // Update Local State
        const newArticle: WikiArticle = {
          id: newId,
          ...newArticleData
        };
        setArticles(prev => [newArticle, ...prev]);
        setSelectedArticle(newArticle);

      } else if (selectedArticle && editForm.id) {
        // Updating
        const updates = {
          title: editForm.title,
          category: editForm.category,
          content: editForm.content,
          tags: tagsArray,
          lastModified: timestamp
        };

        await updateWikiArticle(editForm.id, updates);

        const updatedArticle: WikiArticle = {
          ...selectedArticle,
          ...updates
        };
        setArticles(prev => prev.map(a => a.id === updatedArticle.id ? updatedArticle : a));
        setSelectedArticle(updatedArticle);
      }

      setIsEditing(false);
      setIsCreating(false);

    } catch (error) {
      console.error(error);
      alert("儲存失敗，請檢查 Firebase 設定或網路連線。");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Markdown Toolbar Helpers ---
  const insertMarkdown = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const currentText = editForm.content || '';
    
    const before = currentText.substring(0, start);
    const selection = currentText.substring(start, end);
    const after = currentText.substring(end);
    
    const newText = `${before}${prefix}${selection}${suffix}${after}`;
    
    setEditForm({ ...editForm, content: newText });
    
    // Defer focus to allow state update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + prefix.length, end + prefix.length);
      }
    }, 0);
  };

  // --- Render Views ---

  // 1. Edit / Create Form View
  if (isEditing) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <button 
          onClick={() => { setIsEditing(false); setIsCreating(false); }}
          className="mb-6 text-sm text-gray-500 hover:text-[#FF4B7D] flex items-center gap-1 transition-colors"
          disabled={isSaving}
        >
          <ArrowLeft size={16} /> 取消編輯
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
             <h2 className="text-xl font-bold text-gray-800">{isCreating ? '新增知識庫條目' : '編輯條目'}</h2>
             <button 
               onClick={handleSave} 
               disabled={isSaving}
               className="px-4 py-2 bg-[#FF4B7D] text-white rounded-lg flex items-center gap-2 hover:bg-[#E63E6D] font-medium disabled:opacity-70 disabled:cursor-not-allowed"
             >
               {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
               {isSaving ? '儲存中...' : '儲存'}
             </button>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">標題 Title</label>
                <input 
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4B7D] focus:outline-none placeholder-gray-400 text-gray-900"
                  value={editForm.title || ''}
                  onChange={e => setEditForm({...editForm, title: e.target.value})}
                  placeholder="e.g., F-1 簽證申請指南"
                  disabled={isSaving}
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">分類 Category</label>
                <select 
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4B7D] focus:outline-none placeholder-gray-400 text-gray-900"
                  value={editForm.category || WikiCategory.PROCESS}
                  onChange={e => setEditForm({...editForm, category: e.target.value as WikiCategory})}
                  disabled={isSaving}
                >
                  {categories.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">標籤 Tags (以逗號分隔)</label>
              <input 
                className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4B7D] focus:outline-none placeholder-gray-400 text-gray-900"
                value={Array.isArray(editForm.tags) ? editForm.tags.join(', ') : editForm.tags || ''}
                onChange={e => setEditForm({...editForm, tags: e.target.value as any})}
                placeholder="USA, Visa, SOP"
                disabled={isSaving}
              />
            </div>

            <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
              {/* Visual Editor Toolbar */}
              <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 flex-wrap">
                <button onClick={() => insertMarkdown('**', '**')} className="p-1.5 text-gray-600 hover:bg-gray-200 rounded" title="Bold (粗體)">
                  <Bold size={18} />
                </button>
                <button onClick={() => insertMarkdown('*', '*')} className="p-1.5 text-gray-600 hover:bg-gray-200 rounded" title="Italic (斜體)">
                  <Italic size={18} />
                </button>
                <button onClick={() => insertMarkdown('<u>', '</u>')} className="p-1.5 text-gray-600 hover:bg-gray-200 rounded" title="Underline (底線)">
                  <UnderlineIcon size={18} />
                </button>
                <div className="w-px h-5 bg-gray-300 mx-1" />
                <button onClick={() => insertMarkdown('# ')} className="p-1.5 text-gray-600 hover:bg-gray-200 rounded" title="Heading 1 (大標題)">
                  <Heading1 size={18} />
                </button>
                <button onClick={() => insertMarkdown('## ')} className="p-1.5 text-gray-600 hover:bg-gray-200 rounded" title="Heading 2 (副標題)">
                  <Heading2 size={18} />
                </button>
                <div className="w-px h-5 bg-gray-300 mx-1" />
                <button onClick={() => insertMarkdown('- ')} className="p-1.5 text-gray-600 hover:bg-gray-200 rounded" title="List (項目符號)">
                  <List size={18} />
                </button>
                <button onClick={() => insertMarkdown('1. ')} className="p-1.5 text-gray-600 hover:bg-gray-200 rounded" title="Ordered List (編號清單)">
                  <ListOrdered size={18} />
                </button>
                <button onClick={() => insertMarkdown('[', '](url)')} className="p-1.5 text-gray-600 hover:bg-gray-200 rounded" title="Link (連結)">
                  <Link size={18} />
                </button>
              </div>
              
              <textarea 
                ref={textareaRef}
                className="w-full h-96 p-4 focus:outline-none font-mono text-sm leading-relaxed placeholder-gray-400 text-gray-900 bg-white resize-none"
                value={editForm.content || ''}
                onChange={e => setEditForm({...editForm, content: e.target.value})}
                placeholder="# 請在此輸入內容... &#10;可以使用上方工具列輔助排版"
                disabled={isSaving}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. View Detail View
  if (selectedArticle) {
    return (
      <div className="p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => setSelectedArticle(null)}
            className="text-sm text-gray-500 hover:text-[#FF4B7D] flex items-center gap-1 transition-colors"
          >
            <ArrowLeft size={18} /> 返回列表
          </button>

          <div className="flex gap-2">
            <button 
              onClick={() => handleStartEdit(selectedArticle)}
              disabled={isDeleting}
              className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Edit3 size={16} /> 編輯
            </button>
            <button 
              onClick={() => handleDelete(selectedArticle.id)}
              disabled={isDeleting}
              className="px-3 py-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              {isDeleting ? '刪除中...' : '刪除'}
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[60vh]">
          <div className="p-8 border-b border-gray-100 bg-white">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-[#FF4B7D]/10 text-[#FF4B7D] text-xs font-bold rounded-full border border-[#FF4B7D]/20">
                {CATEGORY_LABELS[selectedArticle.category]}
              </span>
              {selectedArticle.tags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full border border-gray-200">
                  #{tag}
                </span>
              ))}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">{selectedArticle.title}</h1>
            <p className="text-sm text-gray-400">最後更新: {selectedArticle.lastModified}</p>
          </div>
          
          <div className="p-8 prose prose-slate max-w-none text-gray-700 leading-relaxed">
            <ReactMarkdown>{selectedArticle.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  // 3. Main List View
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">員工知識庫</h2>
          <p className="text-gray-500 mt-1">流程、話術與專業術語查詢</p>
        </div>
        <button 
          onClick={handleStartCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF4B7D] text-white rounded-lg hover:bg-[#E63E6D] transition-colors shadow-sm font-medium"
        >
          <Plus size={18} />
          <span>新增條目</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Categories */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-2">
          <button 
            onClick={() => setActiveCategory('ALL')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex justify-between items-center ${
              activeCategory === 'ALL' ? 'bg-white shadow-sm text-[#FF4B7D] font-bold border border-rose-50' : 'text-gray-600 hover:bg-white hover:shadow-sm'
            }`}
          >
            <span>全部內容</span>
            {activeCategory === 'ALL' && <ChevronRight size={16} />}
          </button>
          
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex justify-between items-center ${
                activeCategory === cat ? 'bg-white shadow-sm text-[#FF4B7D] font-bold border border-rose-50' : 'text-gray-600 hover:bg-white hover:shadow-sm'
              }`}
            >
              <span>{CATEGORY_LABELS[cat]}</span>
              {activeCategory === cat && <ChevronRight size={16} />}
            </button>
          ))}
        </div>

        {/* Main Content List */}
        <div className="flex-1">
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={20} />
            </div>
            <input
              type="text"
              placeholder="搜尋知識庫文章、合作廠商資訊..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4B7D] focus:border-transparent text-gray-900 shadow-sm placeholder-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            {filteredArticles.length > 0 ? (
              filteredArticles.map(article => (
                <div 
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#FF4B7D]/30 transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF4B7D] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#FF4B7D] transition-colors">
                      {article.title}
                    </h3>
                    <span className="text-xs text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-1 rounded">{article.lastModified}</span>
                  </div>
                  
                  {/* Preview Content (Strip markdown manually for preview) */}
                  <p className="text-gray-500 text-sm line-clamp-2 mb-3">
                    {article.content.replace(/[#*`_]/g, '').substring(0, 150)}...
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200 font-medium">
                      {CATEGORY_LABELS[article.category]}
                    </span>
                    {article.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-xs text-[#FF4B7D] bg-rose-50 px-2 py-0.5 rounded">#{tag}</span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
                <FileText className="mx-auto text-gray-300 mb-3" size={48} />
                <h3 className="text-lg font-medium text-gray-900">
                  {articles.length === 0 ? "知識庫目前是空的" : "沒有找到相關文章"}
                </h3>
                <p className="text-gray-500 mt-1">
                  {articles.length === 0 ? "點擊「新增條目」建立第一筆資料！" : "試試調整搜尋關鍵字或分類"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wiki;
