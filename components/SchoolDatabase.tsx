
import React, { useState, useEffect } from 'react';
import { School } from '../types';
import { Search, Filter, Upload, MapPin, DollarSign, Book, Loader2, School as SchoolIcon, Plus, X, Trash2, Edit2, Save, GraduationCap, CheckCircle, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { parseSchoolDocument } from '../services/geminiService';

interface SchoolDatabaseProps {
  schools: School[];
  setSchools: React.Dispatch<React.SetStateAction<School[]>>;
}

const ITEMS_PER_PAGE = 12;

const SchoolDatabase: React.FC<SchoolDatabaseProps> = ({ schools, setSchools }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Score Filtering State
  const [scoreFilterType, setScoreFilterType] = useState<'GPA' | 'TOEFL' | 'IELTS' | ''>('');
  const [scoreFilterValue, setScoreFilterValue] = useState('');

  const [isUploading, setIsUploading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'VIEW' | 'EDIT' | 'ADD'>('VIEW');
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  
  // Temporary state for editing
  const [editForm, setEditForm] = useState<Partial<School>>({});

  const countries = ['All', 'USA', 'Canada', 'UK', 'Australia'];

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCountry, scoreFilterType, scoreFilterValue]);

  // --- Helpers ---
  
  const parseRequirementValue = (valStr?: string): number => {
    if (!valStr) return 0;
    // Extract first number (float) from string like "3.5+", "92 (min)", "6.5"
    const match = valStr.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[0]) : 0;
  };

  const checkScoreRequirement = (school: School): boolean => {
    if (!scoreFilterType || !scoreFilterValue) return true;
    
    const userScore = parseFloat(scoreFilterValue);
    if (isNaN(userScore)) return true; // Ignore invalid input

    let reqStr = '';
    if (scoreFilterType === 'GPA') reqStr = school.requirements.gpa || '';
    if (scoreFilterType === 'TOEFL') reqStr = school.requirements.toefl || '';
    if (scoreFilterType === 'IELTS') reqStr = school.requirements.ielts || '';

    if (!reqStr) return false; // If school doesn't list requirement, assume it might not match (or debatable)

    const schoolScore = parseRequirementValue(reqStr);
    
    // Logic: User Score must be >= School Requirement
    return userScore >= schoolScore;
  };

  // --- Actions ---

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const mockContent = `
      Brochure for ${file.name.replace('.pdf', '')}
      Location: Boston, Massachusetts.
      Type: University.
      Tuition: Approx $52,000 per year.
      Popular Programs: Biotechnology, International Business, Law.
      Admission: GPA 3.0 minimum, TOEFL 80.
      Key features: Located downtown, great internship opportunities (CPT available).
    `;

    try {
      const newSchoolData = await parseSchoolDocument(file.name, mockContent);
      
      const newSchool: School = {
        id: Date.now().toString(),
        name: newSchoolData.name || 'Unknown School',
        location: newSchoolData.location || 'Unknown Location',
        country: newSchoolData.country || 'USA',
        type: (newSchoolData.type as any) || 'University',
        programs: newSchoolData.programs || [],
        tuitionRange: newSchoolData.tuitionRange || 'TBD',
        requirements: newSchoolData.requirements || {},
        tags: newSchoolData.tags || [],
        updatedAt: new Date().toISOString().split('T')[0]
      };

      setSchools(prev => [newSchool, ...prev]);
      alert(`成功匯入院校資料: ${newSchool.name}`);
    } catch (e) {
      alert("匯入失敗，請確認檔案格式或稍後再試。");
    } finally {
      setIsUploading(false);
      event.target.value = ''; 
    }
  };

  const openAddModal = () => {
    setEditForm({
      name: '',
      location: '',
      country: 'USA',
      type: 'Graduate School', // Default to new type
      programs: [],
      tuitionRange: '',
      requirements: { gpa: '', toefl: '', ielts: '' },
      tags: [],
      description: '',
      isPartner: false
    });
    setModalMode('ADD');
    setIsModalOpen(true);
  };

  const openViewModal = (school: School) => {
    setCurrentSchool(school);
    setEditForm(school); // Pre-fill in case they switch to edit
    setModalMode('VIEW');
    setIsModalOpen(true);
  };

  const handleEdit = () => {
    setModalMode('EDIT');
  };

  const handleDelete = () => {
    if (!currentSchool) return;
    // Direct delete, no confirmation
    setSchools(prev => prev.filter(s => s.id !== currentSchool!.id));
    setIsModalOpen(false);
  };

  const handleSave = () => {
    if (!editForm.name) {
      alert("學校名稱為必填");
      return;
    }

    if (modalMode === 'ADD') {
      const newSchool: School = {
        id: Date.now().toString(),
        name: editForm.name!,
        location: editForm.location || '',
        country: editForm.country || '',
        type: editForm.type as any || 'University',
        programs: typeof editForm.programs === 'string' ? (editForm.programs as string).split(',').map((s: string) => s.trim()) : (editForm.programs || []),
        tuitionRange: editForm.tuitionRange || '',
        requirements: editForm.requirements || {},
        tags: typeof editForm.tags === 'string' ? (editForm.tags as string).split(',').map((s: string) => s.trim()) : (editForm.tags || []),
        description: editForm.description || '',
        isPartner: editForm.isPartner || false,
        updatedAt: new Date().toISOString().split('T')[0]
      };
      setSchools(prev => [newSchool, ...prev]);
    } else if (modalMode === 'EDIT' && currentSchool) {
      setSchools(prev => prev.map(s => s.id === currentSchool.id ? {
        ...s,
        ...editForm,
        // Ensure arrays are handled if input was comma-separated string
        programs: Array.isArray(editForm.programs) ? editForm.programs : (editForm.programs as unknown as string).split(',').map((s: string) => s.trim()),
        tags: Array.isArray(editForm.tags) ? editForm.tags : (editForm.tags as unknown as string).split(',').map((s: string) => s.trim()),
        updatedAt: new Date().toISOString().split('T')[0]
      } as School : s));
    }

    setIsModalOpen(false);
  };

  // --- Render Helpers ---

  const filteredSchools = schools.filter(school => {
    const matchesSearch = 
      school.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      school.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCountry = filterCountry === 'All' || school.country === filterCountry;
    const matchesScore = checkScoreRequirement(school);
    return matchesSearch && matchesCountry && matchesScore;
  });

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredSchools.length / ITEMS_PER_PAGE));
  const currentSchools = filteredSchools.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto relative min-h-screen flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">合作院校資料庫</h2>
          <p className="text-gray-500 mt-1">快速查詢學校入學要求、學費與特色</p>
        </div>
        
        <div className="flex gap-3">
          <label className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors shadow-sm ${isUploading ? 'opacity-75 pointer-events-none' : ''}`}>
            {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
            <span className="font-medium text-sm">{isUploading ? 'AI 解析中...' : '上傳手冊解析'}</span>
            <input type="file" className="hidden" accept=".pdf,.xlsx,.docx" onChange={handleFileUpload} disabled={isUploading} />
          </label>

          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF4B7D] text-white rounded-lg hover:bg-[#E63E6D] transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span className="font-medium text-sm">新增校所</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜尋學校名稱、標籤 (e.g., STEM)..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF4B7D] text-sm text-gray-900 placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Country Filter */}
          <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
            <Filter size={18} className="text-gray-400" />
            <select 
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF4B7D] placeholder-gray-400"
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
            >
              {countries.map(c => <option key={c} value={c}>{c === 'All' ? '所有國家' : c}</option>)}
            </select>
          </div>

          {/* Score Filter */}
          <div className="flex items-center gap-2">
            <GraduationCap size={18} className="text-gray-400" />
            <select 
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF4B7D] placeholder-gray-400"
              value={scoreFilterType}
              onChange={(e) => {
                setScoreFilterType(e.target.value as any);
                if (!e.target.value) setScoreFilterValue('');
              }}
            >
              <option value="">成績篩選 (無)</option>
              <option value="GPA">GPA</option>
              <option value="TOEFL">TOEFL</option>
              <option value="IELTS">IELTS</option>
            </select>

            {scoreFilterType && (
              <input 
                type="number"
                step="0.1"
                placeholder={scoreFilterType === 'GPA' ? "e.g. 3.5" : "e.g. 90"}
                className="w-24 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF4B7D] placeholder-gray-400 animate-in fade-in slide-in-from-left-2"
                value={scoreFilterValue}
                onChange={(e) => setScoreFilterValue(e.target.value)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 content-start">
        {currentSchools.map(school => (
          <div 
            key={school.id} 
            onClick={() => openViewModal(school)}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col cursor-pointer group relative"
          >
            <div className="h-2 bg-[#FF4B7D] w-full group-hover:bg-[#E63E6D] transition-colors"></div>
            
            {/* Partner Badge */}
            {school.isPartner && (
              <div className="absolute top-4 right-4 bg-orange-50 text-orange-600 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-sm z-10 border border-orange-100">
                <CheckCircle size={12} />
                合作校
              </div>
            )}

            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-[#FF4B7D] bg-[#FF4B7D]/10 px-2 py-1 rounded-full">{school.type}</span>
                {!school.isPartner && <span className="text-xs text-gray-400">{school.country}</span>}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 pr-16" title={school.name}>{school.name}</h3>
              <div className="flex items-center text-gray-500 text-sm mb-4">
                <MapPin size={14} className="mr-1" />
                {school.location}, {school.country}
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <DollarSign size={16} className="mt-0.5 text-gray-400 shrink-0" />
                  <span>{school.tuitionRange} / year</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <Book size={16} className="mt-0.5 text-gray-400 shrink-0" />
                  <span className="line-clamp-2">{school.programs.join(', ')}</span>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Admission Reqs</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700">
                  {school.requirements.gpa && (
                    <span className={scoreFilterType === 'GPA' ? 'font-bold text-[#FF4B7D]' : ''}>
                      GPA: <b>{school.requirements.gpa}</b>
                    </span>
                  )}
                  {school.requirements.toefl && (
                    <span className={scoreFilterType === 'TOEFL' ? 'font-bold text-[#FF4B7D]' : ''}>
                      TOEFL: <b>{school.requirements.toefl}</b>
                    </span>
                  )}
                  {school.requirements.ielts && (
                    <span className={scoreFilterType === 'IELTS' ? 'font-bold text-[#FF4B7D]' : ''}>
                      IELTS: <b>{school.requirements.ielts}</b>
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-wrap gap-2">
              {school.tags.map(tag => (
                <span key={tag} className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredSchools.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <SchoolIcon size={48} className="mx-auto mb-4 opacity-30" />
          <p>沒有找到符合條件的學校</p>
          {scoreFilterType && <p className="text-sm mt-2">嘗試降低成績要求標準或切換篩選條件</p>}
        </div>
      )}

      {/* Pagination Controls */}
      {filteredSchools.length > 0 && (
        <div className="mt-8 flex justify-center items-center gap-4">
          <button 
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600"
          >
            <ChevronLeft size={20} />
          </button>
          
          <span className="text-sm font-medium text-gray-600">
            Page <span className="text-[#FF4B7D] font-bold">{currentPage}</span> of {totalPages}
          </span>
          
          <button 
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* --- Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800">
                {modalMode === 'ADD' ? '新增學校資料' : modalMode === 'EDIT' ? '編輯學校資料' : '學校詳細資料'}
              </h3>
              <div className="flex items-center gap-2">
                {modalMode === 'VIEW' && (
                  <>
                    <button onClick={handleEdit} className="p-2 text-gray-500 hover:text-[#FF4B7D] hover:bg-rose-50 rounded-lg transition-colors" title="編輯">
                      <Edit2 size={20} />
                    </button>
                    <button onClick={handleDelete} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="刪除">
                      <Trash2 size={20} />
                    </button>
                  </>
                )}
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              {modalMode === 'VIEW' && currentSchool ? (
                // VIEW MODE
                <div className="space-y-8">
                   <div className="flex justify-between items-start gap-4">
                     <div className="flex-1">
                       <h2 className="text-3xl font-bold text-gray-900 leading-tight mb-2">
                         {currentSchool.name}
                       </h2>
                       <div className="flex items-center text-gray-500">
                         <MapPin size={18} className="mr-1.5 text-gray-400" />
                         {currentSchool.location}, {currentSchool.country}
                       </div>
                     </div>
                     
                     {/* Optimized Badge Layout */}
                     <div className="flex items-center gap-2 shrink-0">
                        {currentSchool.isPartner && (
                           <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-full text-orange-600 font-bold text-sm" title="合作校 Partner">
                             <CheckCircle size={16} />
                             <span>Partner</span>
                           </div>
                        )}
                        <span className="px-3 py-1.5 bg-[#FF4B7D]/10 text-[#FF4B7D] border border-[#FF4B7D]/20 rounded-full text-sm font-semibold">
                          {currentSchool.type}
                        </span>
                     </div>
                   </div>

                   {/* Description Field (Visible in View Mode if exists) */}
                   {currentSchool.description && (
                     <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100 text-gray-800 leading-relaxed text-base break-words whitespace-pre-wrap">
                       <h4 className="font-bold text-[#FF4B7D] mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
                         <BookOpen size={14} /> About School
                       </h4>
                       {currentSchool.description}
                     </div>
                   )}

                   <div className="grid grid-cols-2 gap-6">
                     <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                       <p className="text-sm text-gray-500 mb-1 flex items-center gap-1"><DollarSign size={14}/> Tuition Range</p>
                       <p className="font-bold text-gray-900 text-lg">{currentSchool.tuitionRange}</p>
                     </div>
                     <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                       <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                       <p className="font-bold text-gray-900 text-lg">{currentSchool.updatedAt}</p>
                     </div>
                   </div>

                   <div>
                     <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Book size={18} className="text-[#FF4B7D]" /> Popular Programs</h4>
                     <div className="flex flex-wrap gap-2">
                       {currentSchool.programs.map(p => (
                         <span key={p} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium border border-indigo-100">{p}</span>
                       ))}
                     </div>
                   </div>

                   <div>
                     <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><GraduationCap size={18} className="text-[#FF4B7D]" /> Admission Requirements</h4>
                     <div className="bg-white border border-gray-200 rounded-2xl p-6 grid grid-cols-2 sm:grid-cols-4 gap-6 shadow-sm">
                        <div className="text-center">
                          <p className="text-xs text-gray-400 uppercase mb-1 font-semibold tracking-wide">GPA</p>
                          <p className="font-bold text-xl text-gray-900">{currentSchool.requirements.gpa || '-'}</p>
                        </div>
                        <div className="text-center border-l border-gray-100">
                          <p className="text-xs text-gray-400 uppercase mb-1 font-semibold tracking-wide">TOEFL</p>
                          <p className="font-bold text-xl text-gray-900">{currentSchool.requirements.toefl || '-'}</p>
                        </div>
                        <div className="text-center border-l border-gray-100">
                          <p className="text-xs text-gray-400 uppercase mb-1 font-semibold tracking-wide">IELTS</p>
                          <p className="font-bold text-xl text-gray-900">{currentSchool.requirements.ielts || '-'}</p>
                        </div>
                        <div className="text-center border-l border-gray-100">
                          <p className="text-xs text-gray-400 uppercase mb-1 font-semibold tracking-wide">SAT/GRE</p>
                          <p className="font-bold text-xl text-gray-900">{currentSchool.requirements.sat || '-'}</p>
                        </div>
                     </div>
                   </div>

                   <div>
                     <h4 className="font-bold text-gray-800 mb-3">Tags</h4>
                     <div className="flex flex-wrap gap-2">
                       {currentSchool.tags.map(t => (
                         <span key={t} className="text-xs text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-medium">#{t}</span>
                       ))}
                     </div>
                   </div>
                </div>
              ) : (
                // EDIT / ADD MODE
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">學校名稱 School Name</label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-[#FF4B7D] rounded border-gray-300 focus:ring-[#FF4B7D]"
                            checked={editForm.isPartner || false}
                            onChange={e => setEditForm({...editForm, isPartner: e.target.checked})}
                          />
                          <span className="text-sm font-bold text-orange-600 flex items-center gap-1">
                             <CheckCircle size={14} /> 合作校 Partner
                          </span>
                        </label>
                      </div>
                      <input 
                        className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4B7D] focus:outline-none placeholder-gray-400 text-gray-900"
                        value={editForm.name || ''}
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">地點 Location</label>
                      <input 
                        className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4B7D] focus:outline-none placeholder-gray-400 text-gray-900"
                        value={editForm.location || ''}
                        onChange={e => setEditForm({...editForm, location: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">國家 Country</label>
                      <select 
                        className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4B7D] focus:outline-none placeholder-gray-400 text-gray-900"
                        value={editForm.country || 'USA'}
                        onChange={e => setEditForm({...editForm, country: e.target.value})}
                      >
                        {countries.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">類型 Type</label>
                      <select 
                         className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4B7D] focus:outline-none placeholder-gray-400 text-gray-900"
                         value={editForm.type || 'University'}
                         onChange={e => setEditForm({...editForm, type: e.target.value as any})}
                      >
                        <option value="Graduate School">Graduate School</option>
                        <option value="University">University</option>
                        <option value="High School">High School</option>
                        <option value="Language School">Language School</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">學費範圍 Tuition</label>
                      <input 
                        className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4B7D] focus:outline-none placeholder-gray-400 text-gray-900"
                        placeholder="e.g. $40,000 - $50,000"
                        value={editForm.tuitionRange || ''}
                        onChange={e => setEditForm({...editForm, tuitionRange: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">詳細介紹 Description (不會顯示在列表卡片上)</label>
                    <textarea 
                      className="w-full h-24 p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4B7D] focus:outline-none placeholder-gray-400 text-gray-900 text-sm"
                      value={editForm.description || ''}
                      onChange={e => setEditForm({...editForm, description: e.target.value})}
                      placeholder="請輸入學校的詳細介紹、歷史背景或特色..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">熱門科系 Programs (以逗號分隔)</label>
                    <input 
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4B7D] focus:outline-none placeholder-gray-400 text-gray-900"
                      value={Array.isArray(editForm.programs) ? editForm.programs.join(', ') : editForm.programs || ''}
                      onChange={e => setEditForm({...editForm, programs: e.target.value as any})}
                      placeholder="Computer Science, Business, Engineering"
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <p className="text-sm font-bold text-gray-700 mb-3">入學要求 Requirements</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                         <label className="block text-xs text-gray-500 mb-1">GPA</label>
                         <input className="w-full p-2 text-sm bg-white border border-gray-300 rounded placeholder-gray-400 text-gray-900" value={editForm.requirements?.gpa || ''} onChange={e => setEditForm({...editForm, requirements: {...editForm.requirements, gpa: e.target.value}})} />
                      </div>
                      <div>
                         <label className="block text-xs text-gray-500 mb-1">TOEFL</label>
                         <input className="w-full p-2 text-sm bg-white border border-gray-300 rounded placeholder-gray-400 text-gray-900" value={editForm.requirements?.toefl || ''} onChange={e => setEditForm({...editForm, requirements: {...editForm.requirements, toefl: e.target.value}})} />
                      </div>
                      <div>
                         <label className="block text-xs text-gray-500 mb-1">IELTS</label>
                         <input className="w-full p-2 text-sm bg-white border border-gray-300 rounded placeholder-gray-400 text-gray-900" value={editForm.requirements?.ielts || ''} onChange={e => setEditForm({...editForm, requirements: {...editForm.requirements, ielts: e.target.value}})} />
                      </div>
                      <div>
                         <label className="block text-xs text-gray-500 mb-1">SAT/GRE</label>
                         <input className="w-full p-2 text-sm bg-white border border-gray-300 rounded placeholder-gray-400 text-gray-900" value={editForm.requirements?.sat || ''} onChange={e => setEditForm({...editForm, requirements: {...editForm.requirements, sat: e.target.value}})} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">標籤 Tags (以逗號分隔)</label>
                    <input 
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4B7D] focus:outline-none placeholder-gray-400 text-gray-900"
                      value={Array.isArray(editForm.tags) ? editForm.tags.join(', ') : editForm.tags || ''}
                      onChange={e => setEditForm({...editForm, tags: e.target.value as any})}
                      placeholder="STEM, Urban, Top 50"
                    />
                  </div>

                </div>
              )}
            </div>

            {/* Modal Footer */}
            {(modalMode === 'EDIT' || modalMode === 'ADD') && (
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={handleSave}
                  className="px-5 py-2 bg-[#FF4B7D] text-white font-medium rounded-lg hover:bg-[#E63E6D] transition-colors flex items-center gap-2"
                >
                  <Save size={18} />
                  儲存
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default SchoolDatabase;
