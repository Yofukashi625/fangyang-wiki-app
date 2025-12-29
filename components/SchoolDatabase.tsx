
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { School } from '../types';
import { Search, MapPin, DollarSign, Book, Loader2, School as SchoolIcon, Plus, X, Trash2, Edit2, Save, GraduationCap, CheckCircle, ChevronLeft, ChevronRight, BookOpen, Trophy, Settings, FileSpreadsheet, ExternalLink, Filter } from 'lucide-react';
import { addSchool, updateSchool, deleteSchool } from '../services/firebase';

interface SchoolDatabaseProps {
  schools: School[];
  setSchools: React.Dispatch<React.SetStateAction<School[]>>;
  initialSchoolId?: string | null;
  onClearInitialId?: () => void;
}

const ITEMS_PER_PAGE = 12;

const COUNTRY_OPTIONS = [
  { label: '所有國家', value: 'All' },
  { label: '美國', value: 'USA' },
  { label: '英國', value: 'UK' },
  { label: '澳洲', value: 'Australia' },
  { label: '加拿大', value: 'Canada' },
  { label: '其他國家', value: 'Others' }
];

const SchoolDatabase: React.FC<SchoolDatabaseProps> = ({ schools, setSchools, initialSchoolId, onClearInitialId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Persistent Multi-Score Filtering State
  const [filterGpa, setFilterGpa] = useState('');
  const [filterToefl, setFilterToefl] = useState('');
  const [filterIelts, setFilterIelts] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'VIEW' | 'EDIT' | 'ADD'>('VIEW');
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  const [editForm, setEditForm] = useState<Partial<School>>({});

  // Handle initial ID transition from Dashboard
  useEffect(() => {
    if (initialSchoolId && schools.length > 0) {
      const school = schools.find(s => s.id === initialSchoolId);
      if (school) openViewModal(school);
      onClearInitialId?.();
    }
  }, [initialSchoolId, schools]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCountry, filterGpa, filterToefl, filterIelts]);

  // --- Filtering Logic ---
  const parseRequirementValue = (valStr?: string): number => {
    if (!valStr) return 0;
    const match = valStr.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[0]) : 0;
  };

  const filteredSchools = useMemo(() => {
    return schools.filter(school => {
      // 1. Search (Title, Tags, Description, and ALL Programs)
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        school.name.toLowerCase().includes(searchLower) || 
        school.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        school.programs.some(prog => prog.toLowerCase().includes(searchLower)) ||
        (school.description || '').toLowerCase().includes(searchLower);

      // 2. Country Buttons
      let matchesCountry = true;
      if (filterCountry === 'Others') {
        const majorCountries = ['USA', 'UK', 'Australia', 'Canada'];
        matchesCountry = !majorCountries.includes(school.country);
      } else if (filterCountry !== 'All') {
        matchesCountry = school.country === filterCountry;
      }

      // 3. Multi-Score Requirements
      let matchesScore = true;
      if (filterGpa) {
        const userGpa = parseFloat(filterGpa);
        const reqGpa = parseRequirementValue(school.requirements.gpa);
        if (reqGpa > 0 && userGpa < reqGpa) matchesScore = false;
      }
      if (filterToefl) {
        const userToefl = parseFloat(filterToefl);
        const reqToefl = parseRequirementValue(school.requirements.toefl);
        if (reqToefl > 0 && userToefl < reqToefl) matchesScore = false;
      }
      if (filterIelts) {
        const userIelts = parseFloat(filterIelts);
        const reqIelts = parseRequirementValue(school.requirements.ielts);
        if (reqIelts > 0 && userIelts < reqIelts) matchesScore = false;
      }

      return matchesSearch && matchesCountry && matchesScore;
    });
  }, [schools, searchTerm, filterCountry, filterGpa, filterToefl, filterIelts]);

  const totalPages = Math.max(1, Math.ceil(filteredSchools.length / ITEMS_PER_PAGE));
  const currentSchools = filteredSchools.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // --- Actions ---
  const openAddModal = () => {
    setEditForm({
      name: '',
      location: '',
      country: 'USA',
      type: 'University',
      programs: [],
      tuitionRange: '',
      requirements: { gpa: '', toefl: '', ielts: '', sat: '' },
      tags: [],
      description: '',
      isPartner: false
    });
    setModalMode('ADD');
    setIsModalOpen(true);
  };

  const openViewModal = (school: School) => {
    setCurrentSchool(school);
    setEditForm(school);
    setModalMode('VIEW');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editForm.name) {
      alert("學校名稱為必填");
      return;
    }
    setIsSaving(true);
    const today = new Date().toISOString().split('T')[0];
    try {
      const dataToSave = {
        ...editForm,
        programs: Array.isArray(editForm.programs) ? editForm.programs : (editForm.programs as unknown as string).split(',').map(s => s.trim()).filter(Boolean),
        tags: Array.isArray(editForm.tags) ? editForm.tags : (editForm.tags as unknown as string).split(',').map(s => s.trim()).filter(Boolean),
        updatedAt: today
      } as Omit<School, 'id'>;

      if (modalMode === 'ADD') {
        const newId = await addSchool(dataToSave);
        setSchools(prev => [{ id: newId, ...dataToSave } as School, ...prev]);
      } else if (currentSchool) {
        await updateSchool(currentSchool.id, dataToSave);
        setSchools(prev => prev.map(s => s.id === currentSchool.id ? { ...s, ...dataToSave } as School : s));
      }
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
      alert("儲存失敗");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("確定要刪除此校所資料嗎？")) return;
    try {
      await deleteSchool(id);
      setSchools(prev => prev.filter(s => s.id !== id));
      if (currentSchool?.id === id) setIsModalOpen(false);
    } catch (e) {
      alert("刪除失敗");
    }
  };

  const handleExcelImport = () => {
    alert("Excel 匯入功能開發中。請準備包含學校名稱、國家、學費及各項要求之標準格式。");
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'Graduate School': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'University': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'High School': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Language School': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">合作院校資料庫</h2>
          <p className="text-slate-500 mt-1 text-sm font-medium">全方位搜尋課程、要求與地理位置</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setIsAdminModalOpen(true)}
            className="p-3 text-slate-500 hover:text-[#FF4B7D] hover:bg-rose-50 rounded-2xl border border-slate-200 transition-all shadow-sm bg-white"
            title="後台管理系統"
          >
            <Settings size={22} />
          </button>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-6 py-3 bg-[#FF4B7D] text-white rounded-2xl hover:bg-[#E63E6D] transition-all shadow-md shadow-rose-100 font-black text-sm"
          >
            <Plus size={20} />
            新增校所
          </button>
        </div>
      </div>

      {/* Main Search & Filters Section */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 mb-10 space-y-8">
        {/* Search Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="搜尋學校名稱、所有熱門科系、地理位置、標籤或簡介..."
              className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF4B7D] focus:bg-white text-slate-900 transition-all font-medium placeholder-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#FF4B7D] transition-colors">
                <X size={20} />
              </button>
            )}
          </div>
          
          <div className="lg:col-span-5 flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 px-4 border-r border-slate-200 flex-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">GPA</span>
              <input 
                type="text" inputMode="decimal" placeholder="Min"
                className="w-full bg-transparent focus:outline-none text-base font-black text-slate-900 placeholder-slate-300"
                value={filterGpa} onChange={e => setFilterGpa(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 px-4 border-r border-slate-200 flex-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">TOEFL</span>
              <input 
                type="text" inputMode="numeric" placeholder="Min"
                className="w-full bg-transparent focus:outline-none text-base font-black text-slate-900 placeholder-slate-300"
                value={filterToefl} onChange={e => setFilterToefl(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 px-4 flex-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">IELTS</span>
              <input 
                type="text" inputMode="decimal" placeholder="Min"
                className="w-full bg-transparent focus:outline-none text-base font-black text-slate-900 placeholder-slate-300"
                value={filterIelts} onChange={e => setFilterIelts(e.target.value)}
              />
            </div>
            {(filterGpa || filterToefl || filterIelts) && (
               <button onClick={() => { setFilterGpa(''); setFilterToefl(''); setFilterIelts(''); }} className="p-2 text-slate-400 hover:text-[#FF4B7D] transition-colors shrink-0">
                 <X size={18} />
               </button>
            )}
          </div>
        </div>

        {/* Country Selector Buttons Row */}
        <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">按國家篩選 Country Selection</p>
          <div className="flex flex-wrap gap-3">
            {COUNTRY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilterCountry(opt.value)}
                className={`px-6 py-3 rounded-2xl text-sm font-black transition-all border ${
                  filterCountry === opt.value 
                  ? 'bg-[#FF4B7D] border-[#FF4B7D] text-white shadow-lg shadow-rose-100 scale-105' 
                  : 'bg-white border-slate-200 text-slate-500 hover:border-[#FF4B7D] hover:text-[#FF4B7D]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 flex-1 content-start mb-12">
        {currentSchools.map(school => (
          <div 
            key={school.id} 
            onClick={() => openViewModal(school)}
            className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group flex flex-col"
          >
            <div className="p-8 flex-1">
              <div className="flex justify-between items-start mb-6">
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${getTypeStyle(school.type)}`}>
                  {school.type}
                </span>
                {school.isPartner && (
                  <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-xl text-[10px] font-black border border-orange-100 flex items-center gap-1">
                    <CheckCircle size={10} /> PARTNER
                  </span>
                )}
              </div>

              <h3 className="text-xl font-black text-slate-900 mb-1 leading-tight group-hover:text-[#FF4B7D] transition-colors">{school.name}</h3>
              <p className="text-xs text-slate-400 font-bold flex items-center gap-1 mb-6">
                <MapPin size={12} className="text-slate-300" /> {school.location}, {school.country}
              </p>

              {(school.qsRanking || school.usNewsRanking) && (
                <div className="flex gap-2 mb-6">
                   {school.qsRanking && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-1.5 rounded-xl font-black">QS #{school.qsRanking}</span>}
                   {school.usNewsRanking && <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-xl font-black">US News #{school.usNewsRanking}</span>}
                </div>
              )}
              
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-sm font-bold text-slate-600">
                  <DollarSign size={16} className="text-slate-300 shrink-0" />
                  <span>{school.tuitionRange || '---'}</span>
                </div>
                <div className="flex items-start gap-3 text-sm font-bold text-slate-600">
                  <Book size={16} className="text-slate-300 shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-relaxed">{school.programs.join(', ')}</span>
                </div>
              </div>
            </div>
            
            <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">GPA</div>
                  <div className="text-sm font-black text-slate-700">{school.requirements.gpa || '-'}</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">TOEFL</div>
                  <div className="text-sm font-black text-slate-700">{school.requirements.toefl || '-'}</div>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-[#FF4B7D] transform group-hover:translate-x-2 transition-all" />
            </div>
          </div>
        ))}
      </div>

      {filteredSchools.length === 0 && (
        <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200">
          <SchoolIcon size={80} className="mx-auto mb-6 text-slate-100" />
          <h3 className="text-2xl font-black text-slate-800">未找到符合條件的校所</h3>
          <p className="text-slate-400 mt-2 font-medium">請嘗試調整搜尋關鍵字或篩選器設定</p>
        </div>
      )}

      {/* Pagination */}
      {filteredSchools.length > 0 && (
        <div className="mt-4 mb-16 flex justify-center items-center gap-8">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-4 rounded-2xl border border-slate-200 hover:bg-white hover:border-[#FF4B7D] hover:text-[#FF4B7D] disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <ChevronLeft size={22} />
          </button>
          <span className="text-xs font-black text-slate-400 tracking-widest uppercase">
            PAGE <span className="text-[#FF4B7D] text-lg px-2">{currentPage}</span> OF {totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-4 rounded-2xl border border-slate-200 hover:bg-white hover:border-[#FF4B7D] hover:text-[#FF4B7D] disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      )}

      {/* --- Detail/Edit Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-200">
            {/* Header */}
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h3 className="text-2xl font-black text-slate-800">
                {modalMode === 'ADD' ? '新增校所資料' : modalMode === 'EDIT' ? '編輯校所內容' : '校所詳細資訊'}
              </h3>
              <div className="flex items-center gap-3">
                {modalMode === 'VIEW' && (
                  <>
                    <button onClick={() => setModalMode('EDIT')} className="p-3 text-slate-500 hover:text-[#FF4B7D] hover:bg-rose-50 rounded-2xl transition-all" title="編輯">
                      <Edit2 size={20} />
                    </button>
                    <button onClick={() => handleDelete(currentSchool!.id)} className="p-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all" title="刪除">
                      <Trash2 size={20} />
                    </button>
                  </>
                )}
                <button onClick={() => setIsModalOpen(false)} className="p-3 text-slate-400 hover:text-slate-600 rounded-2xl transition-all">
                  <X size={28} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-12 space-y-10 custom-scrollbar">
              {modalMode === 'VIEW' && currentSchool ? (
                <div className="space-y-10 animate-in fade-in duration-500">
                   <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                     <div className="space-y-3">
                       <h2 className="text-4xl font-black text-slate-900 leading-tight">{currentSchool.name}</h2>
                       <div className="flex items-center gap-2 text-xl text-slate-400 font-bold">
                         <MapPin size={24} /> {currentSchool.location}, {currentSchool.country}
                       </div>
                     </div>
                     <div className="flex flex-col items-end gap-4 shrink-0">
                        {currentSchool.isPartner && (
                          <div className="px-5 py-2.5 bg-orange-50 text-orange-600 rounded-2xl border border-orange-100 text-sm font-black flex items-center gap-2">
                            <CheckCircle size={20} /> 合作校 Partner
                          </div>
                        )}
                        <span className={`px-5 py-2.5 rounded-2xl border text-[11px] font-black uppercase tracking-widest ${getTypeStyle(currentSchool.type)}`}>
                          {currentSchool.type}
                        </span>
                     </div>
                   </div>

                   {(currentSchool.qsRanking || currentSchool.usNewsRanking) && (
                      <div className="flex gap-4">
                        {currentSchool.qsRanking && <div className="px-6 py-4 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100 font-black flex items-center gap-2"><Trophy size={20} /> QS #{currentSchool.qsRanking}</div>}
                        {currentSchool.usNewsRanking && <div className="px-6 py-4 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 font-black flex items-center gap-2"><Trophy size={20} /> US NEWS #{currentSchool.usNewsRanking}</div>}
                      </div>
                   )}

                   <div className="bg-rose-50/40 p-10 rounded-[2.5rem] border border-rose-100 text-slate-700 leading-relaxed text-lg whitespace-pre-wrap font-medium">
                      <h4 className="font-black text-[#FF4B7D] mb-6 text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                        <BookOpen size={18} /> 學校特色與簡介
                      </h4>
                      {currentSchool.description || '暫無詳細描述內容。'}
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="space-y-6">
                       <h4 className="font-black text-slate-800 flex items-center gap-2"><GraduationCap size={24} className="text-[#FF4B7D]" /> 入學要求</h4>
                       <div className="bg-slate-50 rounded-[2rem] p-8 grid grid-cols-2 gap-8 border border-slate-100">
                         <div className="text-center">
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">GPA</p>
                           <p className="text-2xl font-black text-slate-800">{currentSchool.requirements.gpa || '-'}</p>
                         </div>
                         <div className="text-center">
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">TOEFL</p>
                           <p className="text-2xl font-black text-slate-800">{currentSchool.requirements.toefl || '-'}</p>
                         </div>
                         <div className="text-center">
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">IELTS</p>
                           <p className="text-2xl font-black text-slate-800">{currentSchool.requirements.ielts || '-'}</p>
                         </div>
                         <div className="text-center">
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">SAT / GRE</p>
                           <p className="text-2xl font-black text-slate-800">{currentSchool.requirements.sat || '-'}</p>
                         </div>
                       </div>
                     </div>
                     <div className="space-y-6">
                       <h4 className="font-black text-slate-800 flex items-center gap-2"><DollarSign size={24} className="text-[#FF4B7D]" /> 財務與更新</h4>
                       <div className="space-y-4">
                         <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">年學費估算</p>
                            <p className="text-xl font-black text-slate-800">{currentSchool.tuitionRange || '---'}</p>
                         </div>
                         <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">資料更新時間</p>
                            <p className="text-xl font-black text-slate-800">{currentSchool.updatedAt}</p>
                         </div>
                       </div>
                     </div>
                   </div>

                   <div>
                     <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2"><Book size={24} className="text-[#FF4B7D]" /> 所有熱門科系</h4>
                     <div className="flex flex-wrap gap-3">
                       {currentSchool.programs.map(p => (
                         <span key={p} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl text-sm font-black shadow-sm">{p}</span>
                       ))}
                     </div>
                   </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="col-span-2">
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-sm font-black text-slate-700 uppercase tracking-widest">學校名稱 School Name</label>
                        <label className="flex items-center gap-2 cursor-pointer bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100">
                          <input type="checkbox" checked={editForm.isPartner || false} onChange={e => setEditForm({...editForm, isPartner: e.target.checked})} className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500" />
                          <span className="text-xs font-black text-orange-600">合作校 Partner</span>
                        </label>
                      </div>
                      <input 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#FF4B7D] outline-none font-black text-slate-900" 
                        value={editForm.name || ''} 
                        onChange={e => setEditForm({...editForm, name: e.target.value})} 
                        placeholder="請輸入學校中文或英文名稱"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-black text-slate-700 uppercase tracking-widest block mb-3">地點 Location</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#FF4B7D] outline-none font-black text-slate-900" value={editForm.location || ''} onChange={e => setEditForm({...editForm, location: e.target.value})} placeholder="e.g. Seattle, WA" />
                    </div>
                    <div>
                      <label className="text-sm font-black text-slate-700 uppercase tracking-widest block mb-3">國家 Country</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#FF4B7D] outline-none font-black text-slate-900" value={editForm.country || ''} onChange={e => setEditForm({...editForm, country: e.target.value})} placeholder="e.g. USA, UK, Canada..." />
                    </div>
                    <div>
                      <label className="text-sm font-black text-slate-700 uppercase tracking-widest block mb-3">類型 Type</label>
                      <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#FF4B7D] outline-none font-black text-slate-900 appearance-none" value={editForm.type || 'University'} onChange={e => setEditForm({...editForm, type: e.target.value as any})}>
                        <option value="Graduate School">Graduate School</option>
                        <option value="University">University</option>
                        <option value="High School">High School</option>
                        <option value="Language School">Language School</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-black text-slate-700 uppercase tracking-widest block mb-3">學費估計 Tuition</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#FF4B7D] outline-none font-black text-slate-900" value={editForm.tuitionRange || ''} onChange={e => setEditForm({...editForm, tuitionRange: e.target.value})} placeholder="e.g. $40,000 - $55,000" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest">QS Ranking</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        className="w-full bg-transparent outline-none font-black text-2xl text-slate-900" 
                        value={editForm.qsRanking || ''} 
                        onChange={e => setEditForm({...editForm, qsRanking: Number(e.target.value) || undefined})} 
                        placeholder="N/A"
                      />
                    </div>
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest">US News Ranking</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        className="w-full bg-transparent outline-none font-black text-2xl text-slate-900" 
                        value={editForm.usNewsRanking || ''} 
                        onChange={e => setEditForm({...editForm, usNewsRanking: Number(e.target.value) || undefined})} 
                        placeholder="N/A"
                      />
                    </div>
                  </div>

                  <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">門檻要求 Requirements</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                       <div><label className="text-[10px] font-black text-slate-500 mb-2 block tracking-widest">GPA</label><input className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-black text-slate-900" value={editForm.requirements?.gpa || ''} onChange={e => setEditForm({...editForm, requirements: {...(editForm.requirements || {}), gpa: e.target.value}})} /></div>
                       <div><label className="text-[10px] font-black text-slate-500 mb-2 block tracking-widest">TOEFL</label><input className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-black text-slate-900" value={editForm.requirements?.toefl || ''} onChange={e => setEditForm({...editForm, requirements: {...(editForm.requirements || {}), toefl: e.target.value}})} /></div>
                       <div><label className="text-[10px] font-black text-slate-500 mb-2 block tracking-widest">IELTS</label><input className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-black text-slate-900" value={editForm.requirements?.ielts || ''} onChange={e => setEditForm({...editForm, requirements: {...(editForm.requirements || {}), ielts: e.target.value}})} /></div>
                       <div><label className="text-[10px] font-black text-slate-500 mb-2 block tracking-widest">SAT / OTHER</label><input className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-black text-slate-900" value={editForm.requirements?.sat || ''} onChange={e => setEditForm({...editForm, requirements: {...(editForm.requirements || {}), sat: e.target.value}})} /></div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest block mb-3">熱門科系 Programs (以逗號分隔)</label>
                    <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[2rem] focus:ring-2 focus:ring-[#FF4B7D] outline-none font-bold text-slate-900 h-40 resize-none leading-relaxed" value={Array.isArray(editForm.programs) ? editForm.programs.join(', ') : editForm.programs || ''} onChange={e => setEditForm({...editForm, programs: e.target.value as any})} placeholder="e.g. Computer Science, MBA, LLM, Marketing..." />
                  </div>

                  <div>
                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest block mb-3">詳細特色描述 Description</label>
                    <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[2rem] focus:ring-2 focus:ring-[#FF4B7D] outline-none font-bold text-slate-900 h-40 resize-none leading-relaxed" value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} placeholder="輸入學校排名歷史、特色學程、或是顧問推薦理由..." />
                  </div>

                  <div>
                    <label className="text-sm font-black text-slate-700 uppercase tracking-widest block mb-3">標籤 Tags (以逗號分隔)</label>
                    <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#FF4B7D] outline-none font-black text-slate-900" value={Array.isArray(editForm.tags) ? editForm.tags.join(', ') : editForm.tags || ''} onChange={e => setEditForm({...editForm, tags: e.target.value as any})} placeholder="e.g. STEM, Urban, Top 50, Partner..." />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {modalMode !== 'VIEW' && (
              <div className="p-10 border-t border-slate-100 flex justify-end gap-4 bg-slate-50">
                <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-slate-500 font-black hover:bg-slate-200 rounded-2xl transition-all" disabled={isSaving}>取消</button>
                <button onClick={handleSave} className="px-10 py-3 bg-[#FF4B7D] text-white font-black rounded-2xl hover:bg-[#E63E6D] shadow-xl shadow-rose-100 flex items-center gap-3 transition-all" disabled={isSaving}>
                   {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                   {isSaving ? '正在儲存...' : '確認儲存內容'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Admin Management Modal (Google Sheets UI) --- */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 z-[70] flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-[95vw] h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
            {/* Toolbar Area */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-center shrink-0 bg-[#F8F9FA]">
               <div className="flex items-center gap-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                       <FileSpreadsheet size={24} className="text-emerald-600" />
                       院校後台管理系統
                    </h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">EduConnect Cloud Database Manager</p>
                  </div>
                  <div className="h-8 w-px bg-slate-300"></div>
                  <div className="flex gap-2">
                    <button onClick={handleExcelImport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 font-bold text-xs hover:bg-slate-50 shadow-sm transition-all">
                      <FileSpreadsheet size={16} /> 匯入 Excel
                    </button>
                    <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white border border-slate-800 rounded-lg font-bold text-xs hover:bg-slate-900 shadow-sm transition-all">
                      <Plus size={16} /> 新增列
                    </button>
                  </div>
               </div>
               <button onClick={() => setIsAdminModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-all">
                 <X size={28} />
               </button>
            </div>

            {/* Google Sheets Table Interface */}
            <div className="flex-1 overflow-auto bg-slate-100 relative custom-scrollbar">
               <table className="w-full border-collapse bg-white table-fixed min-w-[1200px]">
                 <thead className="sticky top-0 z-20">
                   <tr className="bg-[#F8F9FA]">
                     <th className="w-12 border border-slate-200 font-medium text-[10px] text-slate-400 bg-slate-50 text-center py-2">#</th>
                     <th className="w-64 border border-slate-200 font-bold text-xs text-slate-600 text-left px-4 py-3">學校名稱 (School Name)</th>
                     <th className="w-32 border border-slate-200 font-bold text-xs text-slate-600 text-left px-4 py-3">國家</th>
                     <th className="w-48 border border-slate-200 font-bold text-xs text-slate-600 text-left px-4 py-3">地理位置</th>
                     <th className="w-32 border border-slate-200 font-bold text-xs text-slate-600 text-center px-4 py-3">類型</th>
                     <th className="w-24 border border-slate-200 font-bold text-xs text-slate-600 text-center px-4 py-3">GPA</th>
                     <th className="w-24 border border-slate-200 font-bold text-xs text-slate-600 text-center px-4 py-3">TOEFL</th>
                     <th className="w-32 border border-slate-200 font-bold text-xs text-slate-600 text-center px-4 py-3">學費估算</th>
                     <th className="w-40 border border-slate-200 font-bold text-xs text-slate-600 text-center px-4 py-3">最後更新</th>
                     <th className="w-40 border border-slate-200 font-bold text-xs text-slate-600 text-center px-4 py-3">操作工具</th>
                   </tr>
                 </thead>
                 <tbody>
                   {schools.map((school, index) => (
                     <tr key={school.id} className="hover:bg-[#E8F0FE] group">
                       <td className="border border-slate-200 bg-slate-50 text-[10px] text-slate-400 font-bold text-center py-2.5">{index + 1}</td>
                       <td className="border border-slate-200 px-4 py-2.5 font-bold text-slate-800 text-sm truncate">{school.name}</td>
                       <td className="border border-slate-200 px-4 py-2.5 text-xs text-slate-600 font-bold">{school.country}</td>
                       <td className="border border-slate-200 px-4 py-2.5 text-xs text-slate-600 font-medium truncate">{school.location}</td>
                       <td className="border border-slate-200 px-4 py-2.5 text-center">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${getTypeStyle(school.type)}`}>
                            {school.type.split(' ')[0]}
                          </span>
                       </td>
                       <td className="border border-slate-200 px-4 py-2.5 text-center text-xs font-black text-slate-800">{school.requirements.gpa || '-'}</td>
                       <td className="border border-slate-200 px-4 py-2.5 text-center text-xs font-black text-slate-800">{school.requirements.toefl || '-'}</td>
                       <td className="border border-slate-200 px-4 py-2.5 text-xs text-slate-500 font-bold text-center">{school.tuitionRange || '---'}</td>
                       <td className="border border-slate-200 px-4 py-2.5 text-[10px] text-slate-300 font-black tabular-nums text-center">{school.updatedAt}</td>
                       <td className="border border-slate-200 px-4 py-2.5 text-center">
                         <div className="flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openViewModal(school)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="詳細"><ExternalLink size={14} /></button>
                            <button onClick={() => { setCurrentSchool(school); setEditForm(school); setModalMode('EDIT'); setIsModalOpen(true); }} className="p-1.5 text-[#FF4B7D] hover:bg-rose-50 rounded" title="編輯"><Edit2 size={14} /></button>
                            <button onClick={(e) => handleDelete(school.id, e)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="刪除"><Trash2 size={14} /></button>
                         </div>
                       </td>
                     </tr>
                   ))}
                   {/* Empty Rows Fillers for Sheets Feel */}
                   {Array.from({ length: Math.max(0, 15 - schools.length) }).map((_, i) => (
                     <tr key={`empty-${i}`}>
                        <td className="border border-slate-200 bg-slate-50 text-[10px] text-slate-400 font-bold text-center py-2.5">{schools.length + i + 1}</td>
                        <td className="border border-slate-200"></td>
                        <td className="border border-slate-200"></td>
                        <td className="border border-slate-200"></td>
                        <td className="border border-slate-200"></td>
                        <td className="border border-slate-200"></td>
                        <td className="border border-slate-200"></td>
                        <td className="border border-slate-200"></td>
                        <td className="border border-slate-200"></td>
                        <td className="border border-slate-200"></td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
            {/* Status Bar */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest shrink-0">
               <div className="flex gap-6">
                 <span>Rows: {schools.length}</span>
                 <span>Columns: 10</span>
                 <span>Selected: 0</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 <span>Cloud Synced</span>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolDatabase;
