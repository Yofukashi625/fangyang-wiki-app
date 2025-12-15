
import React, { useState } from 'react';
import { OnboardingTask } from '../types';
import { Plus, Edit2, Trash2, Calendar, Save, X, BookOpen, CheckSquare, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface OnboardingProps {
  tasks: OnboardingTask[];
  setTasks: React.Dispatch<React.SetStateAction<OnboardingTask[]>>;
}

const Onboarding: React.FC<OnboardingProps> = ({ tasks, setTasks }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'VIEW' | 'EDIT' | 'ADD'>('VIEW');
  const [editForm, setEditForm] = useState<Partial<OnboardingTask>>({});

  // Generate fixed slots for Day 1 to Day 10
  const days = Array.from({ length: 10 }, (_, i) => i + 1);

  // --- Actions ---

  const handleStartAdd = (day: number) => {
    setEditForm({
      day: day,
      title: '',
      description: '- [ ] 任務 1\n- [ ] 任務 2'
    });
    setModalMode('ADD');
    setIsModalOpen(true);
  };

  const handleView = (task: OnboardingTask) => {
    setEditForm(task);
    setModalMode('VIEW');
    setIsModalOpen(true);
  };

  const handleSwitchToEdit = () => {
    setModalMode('EDIT');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Direct delete, no confirmation
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleSave = () => {
    if (!editForm.title || !editForm.day) {
      alert("請填寫完整資訊");
      return;
    }

    if (modalMode === 'EDIT') {
      setTasks(prev => prev.map(t => t.id === editForm.id ? { ...t, ...editForm } as OnboardingTask : t));
    } else {
      const newTask: OnboardingTask = {
        id: 'ob-' + Date.now(),
        day: editForm.day,
        title: editForm.title,
        description: editForm.description || '',
      };
      setTasks(prev => [...prev, newTask]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-gray-800">新人培訓計畫</h2>
        <p className="text-gray-500 mt-2">Day 01 - Day 10 培訓任務總覽</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {days.map((day) => {
          const task = tasks.find(t => t.day === day);
          
          return (
            <div 
              key={day}
              className={`
                relative h-64 rounded-2xl border transition-all duration-300 group flex flex-col overflow-hidden
                ${task 
                  ? 'bg-white border-gray-200 shadow-sm hover:shadow-lg hover:border-[#FF4B7D]/50 cursor-pointer' 
                  : 'bg-gray-50 border-dashed border-gray-300 items-center justify-center hover:bg-gray-100 cursor-pointer'}
              `}
              onClick={() => {
                if (task) handleView(task);
                else handleStartAdd(day);
              }}
            >
              {task ? (
                <>
                  <div className="p-4 border-b border-gray-100 flex justify-between items-start bg-[#FF4B7D]/5 rounded-t-2xl">
                    <div>
                       <span className="text-xs font-bold text-[#FF4B7D] uppercase tracking-wider block mb-1">
                         Day {day.toString().padStart(2, '0')}
                       </span>
                       <h3 className="font-bold text-gray-800 leading-tight line-clamp-2">{task.title}</h3>
                    </div>
                  </div>
                  
                  <div className="p-4 flex-1 overflow-hidden relative">
                    <div className="text-xs text-gray-500 line-clamp-6 prose prose-xs prose-p:my-0 prose-ul:my-0">
                      <ReactMarkdown>{task.description}</ReactMarkdown>
                    </div>
                    {/* Fade overlay for long content */}
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-lg p-1 shadow-sm z-10">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleView(task); }} 
                      className="p-1.5 text-gray-500 hover:text-[#FF4B7D] hover:bg-rose-50 rounded transition-colors"
                      title="預覽"
                    >
                      <Eye size={14} />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(task.id, e)} 
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="刪除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400 group-hover:bg-[#FF4B7D]/10 group-hover:text-[#FF4B7D] transition-colors">
                    <Plus size={24} />
                  </div>
                  <h3 className="font-bold text-gray-400 mb-1">Day {day}</h3>
                  <p className="text-xs text-gray-400">點擊新增課程</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* --- Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Calendar size={18} className="text-[#FF4B7D]" />
                {modalMode === 'VIEW' ? `Day ${editForm.day} 培訓預覽` : 
                 modalMode === 'EDIT' ? `編輯 Day ${editForm.day} 內容` : 
                 `新增 Day ${editForm.day} 內容`}
              </h3>
              <div className="flex gap-2">
                 {modalMode === 'VIEW' && (
                    <button onClick={handleSwitchToEdit} className="p-2 text-gray-500 hover:text-[#FF4B7D] hover:bg-rose-50 rounded-lg" title="編輯">
                      <Edit2 size={18} />
                    </button>
                 )}
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
              {modalMode === 'VIEW' ? (
                // View Mode
                <div>
                   <h2 className="text-2xl font-bold text-gray-900 mb-4">{editForm.title}</h2>
                   <div className="prose prose-slate prose-sm max-w-none text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-xl border border-gray-100">
                     <ReactMarkdown>{editForm.description || ''}</ReactMarkdown>
                   </div>
                </div>
              ) : (
                // Edit/Add Mode
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">今日主題 Title</label>
                    <input 
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4B7D] focus:outline-none placeholder-gray-400 text-gray-900"
                      value={editForm.title}
                      onChange={e => setEditForm({...editForm, title: e.target.value})}
                      placeholder="e.g. 公司文化介紹"
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">詳細任務內容 (Markdown)</label>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <CheckSquare size={12} />
                        <span>支援 - [ ] 待辦清單</span>
                      </div>
                    </div>
                    <textarea 
                      className="w-full h-96 p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4B7D] focus:outline-none font-mono text-sm placeholder-gray-400 leading-relaxed text-gray-900"
                      value={editForm.description}
                      onChange={e => setEditForm({...editForm, description: e.target.value})}
                      placeholder="- [ ] 閱讀員工手冊&#10;- [ ] 設定 Email"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            {modalMode !== 'VIEW' && (
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                 <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium">取消</button>
                 <button onClick={handleSave} className="px-4 py-2 bg-[#FF4B7D] text-white hover:bg-[#E63E6D] rounded-lg transition-colors text-sm font-medium flex items-center gap-2">
                   <Save size={16} /> 儲存
                 </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
