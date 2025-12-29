import React, { useState, useRef } from 'react';
import { Wand2, Plus, Trash2, MapPin, GraduationCap, CheckCircle, FileImage, Loader2, BookOpen } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

type RiskLevel = 'DREAM' | 'MATCH' | 'SAFETY';

interface SchoolEntry {
  id: string;
  riskLevel: RiskLevel;
  nameCN: string;
  nameEN: string;
  deptEN: string;
  ranking: string;
  location: string;
  isSTEM: boolean;
  reqGPA: string;
  reqLanguage: string;
  reqStandard: string;
  isStandardNotRequired: boolean;
  description: string;
}

const RecommendationGenerator: React.FC = () => {
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    gpa: '',
    language: '',
    standardized: ''
  });

  const [schools, setSchools] = useState<SchoolEntry[]>([
    {
      id: '1',
      riskLevel: 'SAFETY',
      nameCN: '',
      nameEN: '',
      deptEN: '',
      ranking: '',
      location: '',
      isSTEM: false,
      reqGPA: '',
      reqLanguage: '',
      reqStandard: '',
      isStandardNotRequired: false,
      description: ''
    }
  ]);

  const addSchool = () => {
    if (schools.length >= 5) return;
    setSchools([...schools, {
      id: Date.now().toString(),
      riskLevel: 'MATCH',
      nameCN: '',
      nameEN: '',
      deptEN: '',
      ranking: '',
      location: '',
      isSTEM: false,
      reqGPA: '',
      reqLanguage: '',
      reqStandard: '',
      isStandardNotRequired: false,
      description: ''
    }]);
  };

  const removeSchool = (id: string) => {
    if (schools.length <= 1) return;
    setSchools(schools.filter(s => s.id !== id));
  };

  const updateSchool = (id: string, updates: Partial<SchoolEntry>) => {
    setSchools(schools.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const downloadAsPng = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await htmlToImage.toPng(exportRef.current, {
        pixelRatio: 2.1,
        backgroundColor: '#ffffff',
        width: 1920,
        height: 1080,
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `選校推薦建議書_${studentInfo.name || '學生'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('PNG export failed', err);
      alert('圖片匯出失敗。');
    } finally {
      setIsExporting(false);
    }
  };

  const getRiskTheme = (level: RiskLevel) => {
    switch (level) {
      case 'DREAM':
        return {
          border: 'border-[#E63E6D]',
          text: 'text-[#E63E6D]',
          badge: 'bg-[#E63E6D]',
          label: '夢幻'
        };
      case 'MATCH':
        return {
          border: 'border-[#FFB952]',
          text: 'text-[#FFB952]',
          badge: 'bg-[#FFB952]',
          label: '合適'
        };
      case 'SAFETY':
        return {
          border: 'border-[#76A68F]',
          text: 'text-[#76A68F]',
          badge: 'bg-[#76A68F]',
          label: '低風險'
        };
    }
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      {/* 操作欄 */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Wand2 className="text-[#FF4B7D]" /> 選校推薦產生器
          </h2>
          <p className="text-gray-500 mt-1 text-sm">輸入資料後一鍵下載選校推薦表！</p>
        </div>
        <button 
          onClick={downloadAsPng}
          disabled={isExporting}
          className="flex items-center gap-2 px-6 py-3 bg-[#FF4B7D] text-white rounded-xl hover:bg-[#E63E6D] transition-all font-bold shadow-md disabled:opacity-50"
        >
          {isExporting ? <Loader2 size={18} className="animate-spin" /> : <FileImage size={18} />}
          下載 PNG 圖檔
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* 編輯輸入區 (垂直) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <GraduationCap size={18} className="text-[#FF4B7D]" /> 學生背景資料
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">學生姓名</label>
                <input 
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-slate-900" 
                  value={studentInfo.name} 
                  onFocus={e => e.target.select()}
                  onChange={e => setStudentInfo({...studentInfo, name: e.target.value})} 
                  placeholder="請輸入姓名" 
                />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">GPA 成績</label>
                <input 
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-slate-900" 
                  value={studentInfo.gpa} 
                  onFocus={e => e.target.select()}
                  onChange={e => setStudentInfo({...studentInfo, gpa: e.target.value})} 
                  placeholder="e.g. 3.8 / 4.0" 
                />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">TOEFL / IELTS</label>
                <input 
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-slate-900" 
                  value={studentInfo.language} 
                  onFocus={e => e.target.select()}
                  onChange={e => setStudentInfo({...studentInfo, language: e.target.value})} 
                  placeholder="e.g. TOEFL 105" 
                />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">GRE / GMAT</label>
                <input 
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-slate-900" 
                  value={studentInfo.standardized} 
                  onFocus={e => e.target.select()}
                  onChange={e => setStudentInfo({...studentInfo, standardized: e.target.value})} 
                  placeholder="e.g. GRE 325" 
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-800">推薦學校設定 ({schools.length}/5)</h3>
              <button onClick={addSchool} className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-slate-900 transition-colors">
                <Plus size={14} /> 新增
              </button>
            </div>
            {schools.map((school, index) => (
              <div key={school.id} className="bg-white p-5 rounded-2xl border border-gray-200 space-y-4 shadow-sm relative group">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-gray-300 tracking-widest uppercase">School #0{index + 1}</span>
                  <div className="flex gap-2">
                    <select 
                      className="text-xs border border-gray-200 rounded-lg p-1.5 bg-gray-50 text-slate-900 font-bold"
                      value={school.riskLevel}
                      onChange={e => updateSchool(school.id, { riskLevel: e.target.value as RiskLevel })}
                    >
                      <option value="SAFETY">低風險 (Safety)</option>
                      <option value="MATCH">合適 (Match)</option>
                      <option value="DREAM">夢幻 (Dream)</option>
                    </select>
                    <button onClick={() => removeSchool(school.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <input className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-slate-900" placeholder="學校中文名" onFocus={e => e.target.select()} value={school.nameCN} onChange={e => updateSchool(school.id, { nameCN: e.target.value })} />
                  <input className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-slate-900" placeholder="學校英文名" onFocus={e => e.target.select()} value={school.nameEN} onChange={e => updateSchool(school.id, { nameEN: e.target.value })} />
                </div>
                <input className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-slate-900" placeholder="系所英文名 (Program Title)" onFocus={e => e.target.select()} value={school.deptEN} onChange={e => updateSchool(school.id, { deptEN: e.target.value })} />

                <div className="grid grid-cols-2 gap-3">
                  <input className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-slate-900" placeholder="QS / US News 排名" onFocus={e => e.target.select()} value={school.ranking} onChange={e => updateSchool(school.id, { ranking: e.target.value })} />
                  <input className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-slate-900" placeholder="地理位置 (e.g. New York)" onFocus={e => e.target.select()} value={school.location} onChange={e => updateSchool(school.id, { location: e.target.value })} />
                </div>

                <div className="grid grid-cols-3 gap-3 items-start">
                  <div className="flex flex-col h-full">
                    <label className="text-[9px] font-bold text-gray-400 mb-1 uppercase tracking-tight">GPA 要求</label>
                    <input className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-slate-900 flex-1" onFocus={e => e.target.select()} placeholder="GPA Req" value={school.reqGPA} onChange={e => updateSchool(school.id, { reqGPA: e.target.value })} />
                  </div>
                  <div className="flex flex-col h-full">
                    <label className="text-[9px] font-bold text-gray-400 mb-1 uppercase tracking-tight">語言要求</label>
                    <input className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-slate-900 flex-1" onFocus={e => e.target.select()} placeholder="T/I Score" value={school.reqLanguage} onChange={e => updateSchool(school.id, { reqLanguage: e.target.value })} />
                  </div>
                  <div className="flex flex-col h-full relative">
                    <div className="flex justify-between items-center mb-1 pr-1">
                       <label className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">GRE/GMAT</label>
                       <label className="flex items-center gap-1 cursor-pointer">
                          <input type="checkbox" checked={school.isStandardNotRequired} onChange={e => updateSchool(school.id, { isStandardNotRequired: e.target.checked, reqStandard: e.target.checked ? 'Not Required' : '' })} className="w-3 h-3 text-[#FF4B7D] rounded" />
                          <span className="text-[8px] font-bold text-gray-400 leading-none">免考</span>
                       </label>
                    </div>
                    <input 
                      className={`w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-slate-900 flex-1 ${school.isStandardNotRequired ? 'opacity-30' : ''}`} 
                      onFocus={e => e.target.select()}
                      placeholder="G/G Score" 
                      value={school.reqStandard} 
                      disabled={school.isStandardNotRequired}
                      onChange={e => updateSchool(school.id, { reqStandard: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={school.isSTEM} onChange={e => updateSchool(school.id, { isSTEM: e.target.checked })} className="w-4 h-4 rounded text-emerald-500 border-gray-300" />
                    STEM 認證課程
                  </label>
                </div>

                <textarea className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs text-slate-900 h-24 resize-none leading-relaxed" onFocus={e => e.target.select()} placeholder="請輸入學校基本特色與推薦理由..." value={school.description} onChange={e => updateSchool(school.id, { description: e.target.value })} />
              </div>
            ))}
          </div>
        </div>

        {/* 預覽區 (垂直) */}
        <div className="lg:col-span-7 bg-white p-12 rounded-3xl border border-gray-200 shadow-sm overflow-hidden h-fit sticky top-8">
          <div className="text-center border-b-4 border-slate-50 pb-10 mb-12">
            <div className="text-[#FF4B7D] font-black text-5xl italic tracking-tighter mb-4 transform -skew-x-12 drop-shadow-sm">FANGYANG NEXUS</div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase mb-8">專業選校評估建議</h2>
            
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 flex items-center gap-2 shadow-sm">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">STUDENT</span>
                <span className="text-sm font-black text-slate-800">{studentInfo.name || '---'}</span>
              </div>
              <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 flex items-center gap-2 shadow-sm">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">GPA</span>
                <span className="text-sm font-black text-slate-800">{studentInfo.gpa || '---'}</span>
              </div>
              <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 flex items-center gap-2 shadow-sm">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">LANG</span>
                <span className="text-sm font-black text-slate-800">{studentInfo.language || '---'}</span>
              </div>
              <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 flex items-center gap-2 shadow-sm">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">TEST</span>
                <span className="text-sm font-black text-slate-800">{studentInfo.standardized || '---'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-10">
            {schools.map((school) => {
              const theme = getRiskTheme(school.riskLevel);
              return (
                <div key={school.id} className={`p-8 border-4 rounded-[3rem] ${theme.border} bg-white relative overflow-hidden shadow-sm`}>
                  <div className={`absolute top-0 right-0 ${theme.badge} px-10 py-4 rounded-bl-[3rem] text-sm font-black text-white shadow-md tracking-widest uppercase`}>
                    {theme.label}
                  </div>
                  
                  <div className="mb-6">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{school.ranking || 'US NEWS / QS RANK'}</div>
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                      <MapPin size={14} className="text-[#FF4B7D]" /> {school.location || 'Location Not Set'}
                    </div>
                  </div>
                  
                  <div className="space-y-1 mb-8">
                    <h4 className="text-2xl font-black text-slate-900 leading-tight">{school.nameCN || '學校中文名稱'}</h4>
                    <p className="text-sm text-slate-400 font-bold italic">{school.nameEN || 'University Name'}</p>
                    <div className="h-1 w-16 bg-[#FF4B7D] my-5"></div>
                    <p className="text-lg font-black text-slate-700 leading-snug">{school.deptEN || 'Program Title'}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-0 border-y-2 border-slate-50 py-8 mb-8">
                    <div className="text-center">
                      <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">GPA</div>
                      <div className="text-xl font-black text-slate-800">{school.reqGPA || '---'}</div>
                    </div>
                    <div className="text-center border-x-2 border-slate-50 px-2">
                      <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">LANGUAGE</div>
                      <div className="text-xl font-black text-slate-800">{school.reqLanguage || '---'}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">TEST</div>
                      <div className="text-xl font-black text-slate-800">{school.reqStandard || '---'}</div>
                    </div>
                  </div>
                  
                  {school.isSTEM && (
                    <div className="mb-6 flex items-center gap-2 text-xs font-black text-emerald-600">
                      <CheckCircle size={18} /> STEM Certified
                    </div>
                  )}

                  <p className="text-sm text-slate-500 leading-relaxed italic opacity-90 border-l-4 border-slate-100 pl-4 py-1">
                    {school.description || '請在左側輸入介紹內容...'}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 pt-8 border-t-2 border-slate-50 space-y-2 text-[10px] font-black text-slate-300">
            <p>• 英檢成績（數值）意味單科不得低於該分數</p>
            <p>• 低風險，意味依照過往申請學生成績回測後進行之評估結果</p>
            <p>• 本建議書由 FangYang Nexus 系統自動產生，僅供內部顧問諮詢參考</p>
          </div>
        </div>
      </div>

      <div className="fixed top-[-10000px] left-[-10000px] pointer-events-none">
        <div 
          ref={exportRef}
          className="bg-white p-14 w-[1920px] h-[1080px] flex flex-col font-sans overflow-hidden"
        >
          <div className="mb-10 text-center border-b-[6px] border-slate-50 pb-8 flex-shrink-0">
            <div className="text-[#FF4B7D] font-black text-7xl italic tracking-tighter mb-5 transform -skew-x-12 drop-shadow-sm">FANGYANG NEXUS</div>
            <div className="flex justify-center gap-10">
              <div className="bg-slate-50 px-8 py-3 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
                <span className="text-lg font-black text-slate-400 uppercase tracking-widest">STUDENT</span>
                <span className="text-2xl font-black text-slate-800">{studentInfo.name || '---'}</span>
              </div>
              <div className="bg-slate-50 px-8 py-3 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
                <span className="text-lg font-black text-slate-400 uppercase tracking-widest">GPA</span>
                <span className="text-2xl font-black text-slate-800">{studentInfo.gpa || '---'}</span>
              </div>
              <div className="bg-slate-50 px-8 py-3 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
                <span className="text-lg font-black text-slate-400 uppercase tracking-widest">LANGUAGE</span>
                <span className="text-2xl font-black text-slate-800">{studentInfo.language || '---'}</span>
              </div>
              <div className="bg-slate-50 px-8 py-3 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
                <span className="text-lg font-black text-slate-400 uppercase tracking-widest">TEST</span>
                <span className="text-2xl font-black text-slate-800">{studentInfo.standardized || '---'}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-8 flex-1 items-stretch overflow-hidden mb-8">
            {schools.slice(0, 3).map((school) => {
              const theme = getRiskTheme(school.riskLevel);
              return (
                <div key={school.id} className={`flex-1 flex flex-col p-10 border-[6px] ${theme.border} rounded-[4rem] bg-white shadow-xl relative overflow-hidden`}>
                  <div className={`absolute top-0 right-0 ${theme.badge} px-12 py-5 rounded-bl-[4rem] text-2xl font-black text-white shadow-md tracking-widest uppercase z-20`}>
                    {theme.label}
                  </div>

                  <div className="mb-6 pt-1">
                    <div className="text-xl font-black text-slate-400 tracking-widest uppercase mb-2">{school.ranking || 'RANKING N/A'}</div>
                    <div className="flex items-center gap-2 text-xl font-black text-slate-800">
                      <MapPin size={22} className="text-[#FF4B7D]" /> {school.location || '---'}
                    </div>
                  </div>

                  <div className="mb-8 flex-shrink-0">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2 leading-tight truncate">{school.nameCN || '學校名稱'}</h2>
                    <p className="text-2xl font-black text-slate-400 italic mb-5 truncate">{school.nameEN || 'University Name'}</p>
                    <div className="h-1.5 w-20 bg-[#FF4B7D] mb-6"></div>
                    <h3 className="text-2xl font-black text-slate-800 leading-tight mb-2 line-clamp-1">{school.deptEN || 'Program Title'}</h3>
                  </div>

                  <div className="grid grid-cols-3 gap-0 border-y-4 border-slate-50 py-8 mb-6 flex-shrink-0">
                    <div className="text-center">
                      <div className="text-base font-black text-slate-400 uppercase tracking-widest mb-1">GPA</div>
                      <div className="text-2xl font-black text-slate-900">{school.reqGPA || '---'}</div>
                    </div>
                    <div className="text-center border-x-4 border-slate-50 px-1">
                      <div className="text-base font-black text-slate-400 uppercase tracking-widest mb-1">LANG</div>
                      <div className="text-2xl font-black text-slate-900">{school.reqLanguage || '---'}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-black text-slate-400 uppercase tracking-widest mb-1">TEST</div>
                      <div className="text-2xl font-black text-slate-900">{school.reqStandard || '---'}</div>
                    </div>
                  </div>

                  <div className="mb-5 flex-shrink-0 min-h-[36px]">
                    {school.isSTEM && (
                      <div className="flex items-center gap-2 text-xl font-black text-emerald-600">
                        <CheckCircle size={24} /> STEM Certified
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-hidden border-l-4 border-slate-50 pl-5 py-1">
                    <p className="text-lg text-slate-500 font-bold leading-[1.6] text-justify italic opacity-90">
                      {school.description || '請在左側輸入介紹內容...'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-8 border-t-[6px] border-slate-50 text-slate-300 flex justify-between items-end flex-shrink-0">
             <div className="space-y-1 text-lg font-black">
                <p>• 英檢成績（數值）意味單科不得低於該分數</p>
                <p>• 低風險，意味依照過往申請學生成績回測後進行之評估結果</p>
                <p>• 本建議書由 FangYang Nexus 系統自動產生，僅供內部顧問諮詢參考</p>
             </div>
             <div className="text-3xl font-black opacity-30 italic tracking-tighter text-right leading-none">
               PROFESSIONAL CONSULTANCY REPORT<br/>
               <span className="text-lg tracking-widest">FANGYANG NEXUS</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendationGenerator;