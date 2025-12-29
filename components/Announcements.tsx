import React, { useState, useRef, useEffect } from 'react';
import { Announcement, AnnouncementCategory } from '../types';
import { Search, ChevronRight, FileText, Plus, Edit3, Trash2, ArrowLeft, Save, Loader2, X, Bell } from 'lucide-react';
import { addAnnouncement, updateAnnouncement, deleteAnnouncement } from '../services/firebase';
import { RichTextEditor } from './RichTextEditor';

interface AnnouncementsProps {
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  initialAction?: string | null;
  onClearAction?: () => void;
}

const CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  [AnnouncementCategory.PARTNER]: '合作廠商資訊',
  [AnnouncementCategory.INTERNAL]: '公司內部公告',
  [AnnouncementCategory.RULES]: '申請規則異動',
  [AnnouncementCategory.ACTIVITIES]: '放洋最新活動'
};

const Announcements: React.FC<AnnouncementsProps> = ({ announcements, setAnnouncements, initialAction, onClearAction }) => {
  const [activeCategory, setActiveCategory] = useState<AnnouncementCategory | 'ALL'>('ALL');
  const [selectedItem, setSelectedItem] = useState<Announcement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false); 
  
  const [editForm, setEditForm] = useState<Partial<Announcement>>({});

  useEffect(() => {
    if (initialAction === 'CREATE_ANNOUNCEMENT') {
      handleStartCreate();
      onClearAction?.();
    }
  }, [initialAction]);

  const filteredItems = announcements.filter(item => {
    const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      item.title.toLowerCase().includes(searchLower) || 
      item.content.toLowerCase().includes(searchLower) ||
      (item.tags || []).some(tag => tag.toLowerCase().includes(searchLower));
    return matchesCategory && matchesSearch;
  });

  const categories = Object.keys(CATEGORY_LABELS) as AnnouncementCategory[];

  const handleStartCreate = () => {
    setEditForm({
      title: '',
      category: AnnouncementCategory.INTERNAL,
      content: '',
      date: new Date().toISOString().split('T')[0],
      tags: []
    });
    setIsCreating(true);
    setSelectedItem(null); 
    setIsEditing(true); 
  };

  const handleStartEdit = (item: Announcement) => {
    setEditForm(item);
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    const previous = [...announcements];
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    if (selectedItem?.id === id) setSelectedItem(null); 
    setIsEditing(false);
    
    try {
      await deleteAnnouncement(id);
    } catch (error) {
      console.error(error);
      setAnnouncements(previous);
      alert("刪除失敗，請檢查網路連線。");
    }
  };

  const handleSave = async () => {
    if (!editForm.title || !editForm.content) {
      alert("標題與內容為必填");
      return;
    }

    setIsSaving(true);
    const timestamp = new Date().toISOString().split('T')[0];
    
    const tagsArray = typeof editForm.tags === 'string' 
      ? (editForm.tags as string).split(',').map((s:string) => s.trim()).filter(Boolean)
      : (editForm.tags || []);

    try {
      if (isCreating) {
        const data = {
          title: editForm.title!,
          category: editForm.category || AnnouncementCategory.INTERNAL,
          content: editForm.content!,
          date: timestamp,
          tags: tagsArray
        };
        const newId = await addAnnouncement(data);
        const newItem: Announcement = { id: newId, ...data };
        setAnnouncements(prev => [newItem, ...prev]);
        setSelectedItem(newItem);

        // 發送通知到 GAS Web App (LINE Flex Message)
        try {
          const GAS_URL = 'https://script.google.com/macros/s/AKfycbyTGkIj8N7dGeeHoIwm2pk02-91ENxEQ4PyXi3xLa57A5QUbHFkCAaO7WbCxC-R3Jmi/exec';
          const categoryLabel = CATEGORY_LABELS[data.category] || "一般公告";
          const summaryText = getCleanPreview(data.content).substring(0, 30) + "...";

          await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              title: data.title,
              category: categoryLabel,
              summary: summaryText
            }),
          });
        } catch (gasError) {
          console.error("LINE通知發送失敗:", gasError);
        }

      } else if (selectedItem && editForm.id) {
        const updates = {
          title: editForm.title!,
          category: editForm.category || selectedItem.category,
          content: editForm.content!,
          date: timestamp,
          tags: tagsArray
        };
        await updateAnnouncement(editForm.id, updates);
        const updatedItem: Announcement = { ...selectedItem, ...updates };
        setAnnouncements(prev => prev.map(a => a.id === updatedItem.id ? updatedItem : a));
        setSelectedItem(updatedItem);
      }
      setIsEditing(false);
      setIsCreating(false);
    } catch (error) {
      console.error(error);
      alert("儲存失敗");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation();
    setSearchTerm(tag);
    setSelectedItem(null);
  };

  const getCleanPreview = (html: string) => {
    return html
      .replace(/<[^>]*>?/gm, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&[a-z0-9]+;/gi, '')
      .substring(0, 150);
  };

  if (isEditing) {
    return (
      <div className="p-8 max-w-5xl mx-auto relative">
        <button onClick={() => { setIsEditing(false); setIsCreating(false); }} className="mb-6 text-sm text-gray-500 hover:text-[#FF4B7D] flex items-center gap-1 transition-colors">
          <ArrowLeft size={16} /> 取消編輯
        </button>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
             <h2 className="text-xl font-bold text-gray-800">{isCreating ? '發佈新公告' : '編輯公告'}</h2>
             <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-[#FF4B7D] text-white rounded-lg flex items-center gap-2 hover:bg-[#E63E6D] font-medium disabled:opacity-70">
               {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
               儲存公告
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
                  placeholder="請輸入標題..." 
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">公告類別 Category</label>
                <select 
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4B7D] focus:outline-none text-gray-900" 
                  value={editForm.category || AnnouncementCategory.INTERNAL} 
                  onChange={e => setEditForm({...editForm, category: e.target.value as AnnouncementCategory})}
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
                placeholder="例如: Shorelight, 美國, 2024夏季"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">詳細內容 Content</label>
              <RichTextEditor value={editForm.content || ''} onChange={(val) => setEditForm({...editForm, content: val})} placeholder="請輸入詳細內容..." className="min-h-[400px]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedItem) {
    return (
      <div className="p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300 relative">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => setSelectedItem(null)} className="text-sm text-gray-500 hover:text-[#FF4B7D] flex items-center gap-1 transition-colors">
            <ArrowLeft size={18} /> 返回公告列表
          </button>
          <div className="flex gap-2">
            <button onClick={() => handleStartEdit(selectedItem)} className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-medium transition-colors"><Edit3 size={16} /> 編輯</button>
            <button onClick={(e) => handleDelete(selectedItem.id, e)} className="px-3 py-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 flex items-center gap-2 text-sm font-medium transition-colors"><Trash2 size={16} /> 刪除</button>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[60vh]">
          <div className="p-8 border-b border-gray-100 bg-white">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-100 inline-block">
                {CATEGORY_LABELS[selectedItem.category]}
              </span>
              {(selectedItem.tags || []).map(tag => (
                <span 
                  key={tag} 
                  onClick={(e) => handleTagClick(e, tag)}
                  className="px-2 py-1 bg-rose-50 text-[#FF4B7D] text-[10px] font-bold rounded border border-rose-100 cursor-pointer hover:bg-rose-100 transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">{selectedItem.title}</h1>
            <p className="text-sm text-gray-400">發佈日期: {selectedItem.date}</p>
          </div>
          <div className="p-8 prose prose-slate max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedItem.content }} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto relative">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Bell className="text-[#FF4B7D]" /> 最新公告</h2>
          <p className="text-gray-500 mt-1">即時掌握合作廠商、規則異動與公司活動</p>
        </div>
        <button onClick={handleStartCreate} className="flex items-center gap-2 px-4 py-2 bg-[#FF4B7D] text-white rounded-lg hover:bg-[#E63E6D] shadow-sm font-medium">
          <Plus size={18} /> 發佈公告
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-64 flex-shrink-0 space-y-2">
          <button onClick={() => setActiveCategory('ALL')} className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex justify-between items-center ${activeCategory === 'ALL' ? 'bg-white shadow-sm text-[#FF4B7D] font-bold border border-rose-50' : 'text-gray-600 hover:bg-white'}`}>
            <span>全部公告</span>
            {activeCategory === 'ALL' && <ChevronRight size={16} />}
          </button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex justify-between items-center ${activeCategory === cat ? 'bg-white shadow-sm text-[#FF4B7D] font-bold border border-rose-50' : 'text-gray-600 hover:bg-white'}`}>
              <span>{CATEGORY_LABELS[cat]}</span>
              {activeCategory === cat && <ChevronRight size={16} />}
            </button>
          ))}
        </div>

        <div className="flex-1">
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={20} />
            </div>
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="搜尋公告標題、標籤或關鍵字..." 
              className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4B7D] text-gray-900 shadow-sm placeholder-gray-400" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
            {searchTerm && (
              <button onClick={handleClearSearch} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#FF4B7D] transition-colors">
                <X size={18} />
              </button>
            )}
          </div>

          <div className="space-y-4">
            {filteredItems.length > 0 ? (
              filteredItems.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedItem(item)} 
                  className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#FF4B7D]/30 transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF4B7D] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <button 
                    onClick={(e) => handleDelete(item.id, e)}
                    className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                    title="直接刪除"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="flex justify-between items-start mb-2 pr-8">
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#FF4B7D] transition-colors">{item.title}</h3>
                    <span className="text-xs text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-1 rounded">{item.date}</span>
                  </div>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-3">
                    {getCleanPreview(item.content)}...
                  </p>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200 font-medium">
                      {CATEGORY_LABELS[item.category]}
                    </span>
                    {(item.tags || []).slice(0, 3).map(tag => (
                      <span 
                        key={tag} 
                        onClick={(e) => handleTagClick(e, tag)}
                        className="text-[10px] text-[#FF4B7D] bg-rose-50 px-2 py-0.5 rounded border border-rose-100 hover:bg-rose-100 transition-colors"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
                <FileText className="mx-auto text-gray-300 mb-3" size={48} />
                <h3 className="text-lg font-medium text-gray-900">尚無公告內容</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Announcements;