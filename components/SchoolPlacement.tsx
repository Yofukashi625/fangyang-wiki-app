import React, { useState } from 'react';
import { School } from '../types';
import { analyzeSchoolPlacement } from '../services/geminiService';
import { Loader2, Target, CheckCircle, AlertCircle, ArrowRight, BookOpen, MapPin, Trophy, ChevronDown } from 'lucide-react';

interface SchoolPlacementProps {
  schools: School[];
}

const SchoolPlacement: React.FC<SchoolPlacementProps> = ({ schools }) => {
  const [formData, setFormData] = useState({
    gpa: '',
    testScores: '',
    major: '',
    preferences: ''
  });
  
  const [schoolCount, setSchoolCount] = useState<3 | 4 | 5>(3);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{ dream: School[], match: School[], safety: School[], reasoning: string } | null>(null);

  const handleAnalyze = async () => {
    if (!formData.gpa || !formData.major) {
      alert("請填寫 GPA 與目標科系");
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeSchoolPlacement(formData, schools, schoolCount);
      setResult(analysis);
    } catch (e) {
      alert("分析失敗，請稍後再試");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderSchoolCard = (school: School) => (
    <div key={school.id} className="p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-all">
       <div className="flex justify-between items-start mb-2">
         <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{school.name}</h4>
         {(school.qsRanking || school.usNewsRanking) && (
            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
              #{school.qsRanking || school.usNewsRanking}
            </span>
         )}
       </div>
       <div className="text-xs text-gray-500 flex items-center gap-1 mb-2">
         <MapPin size={10} /> {school.location}
       </div>
       <div className="flex flex-wrap gap-1">
         {school.requirements.gpa && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">GPA {school.requirements.gpa}</span>}
         {school.requirements.toefl && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">TOEFL {school.requirements.toefl}</span>}
       </div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col md:flex-row gap-8">
      {/* Left Panel: Input Form */}
      <div className="w-full md:w-1/3 flex-shrink-0">
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-8">
           <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
             <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
               <Target size={24} />
             </div>
             <div>
               <h2 className="text-lg font-bold text-gray-800">落點選校系統</h2>
               <p className="text-xs text-gray-500">AI 智能分析資料庫</p>
             </div>
           </div>
           
           <div className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">製作學校數量</label>
               <div className="relative w-full">
                 <select
                   className="w-full p-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4B7D] focus:bg-white transition-colors text-black appearance-none cursor-pointer"
                   value={schoolCount}
                   onChange={(e) => setSchoolCount(Number(e.target.value) as 3 | 4 | 5)}
                 >
                   <option value={3} className="text-black">製作 3 所學校 (精選)</option>
                   <option value={4} className="text-black">製作 4 所學校</option>
                   <option value={5} className="text-black">製作 5 所學校 (完整)</option>
                 </select>
                 <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
               </div>
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">在校成績 (GPA/Percent)</label>
               <input 
                 className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4B7D] focus:bg-white transition-colors text-black placeholder-gray-400"
                 placeholder="e.g. 3.7/4.0 or 85%"
                 value={formData.gpa}
                 onChange={e => setFormData({...formData, gpa: e.target.value})}
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">語言/考試成績</label>
               <input 
                 className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4B7D] focus:bg-white transition-colors text-black placeholder-gray-400"
                 placeholder="e.g. TOEFL 100, GRE 320"
                 value={formData.testScores}
                 onChange={e => setFormData({...formData, testScores: e.target.value})}
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">目標申請科系</label>
               <input 
                 className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4B7D] focus:bg-white transition-colors text-black placeholder-gray-400"
                 placeholder="e.g. Computer Science, Marketing"
                 value={formData.major}
                 onChange={e => setFormData({...formData, major: e.target.value})}
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">其他偏好 (選填)</label>
               <textarea 
                 className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF4B7D] focus:bg-white transition-colors h-24 resize-none text-black placeholder-gray-400"
                 placeholder="e.g. 希望在美東、有獎學金、不要太偏僻"
                 value={formData.preferences}
                 onChange={e => setFormData({...formData, preferences: e.target.value})}
               />
             </div>

             <button 
               onClick={handleAnalyze}
               disabled={isAnalyzing}
               className="w-full py-3 bg-[#FF4B7D] text-white rounded-xl font-bold hover:bg-[#E63E6D] transition-colors shadow-lg shadow-rose-200 flex items-center justify-center gap-2 mt-4"
             >
               {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <Target size={20} />}
               {isAnalyzing ? '正在分析資料庫...' : '開始落點分析'}
             </button>
           </div>
         </div>
      </div>

      {/* Right Panel: Results */}
      <div className="flex-1">
        {result ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Reasoning Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-6 rounded-2xl shadow-lg">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <BookOpen size={20} /> AI 分析觀點
              </h3>
              <div 
                className="text-indigo-100 text-sm leading-relaxed whitespace-pre-line prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: result.reasoning.replace(/\n/g, '<br/>') }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Dream Schools */}
              <div className="space-y-4">
                 <div className="flex items-center gap-2 text-rose-500 font-bold border-b border-rose-100 pb-2">
                   <Trophy size={18} />
                   <h3>夢幻 (Dream)</h3>
                   <span className="text-xs font-normal text-gray-400 ml-auto">衝刺嘗試</span>
                 </div>
                 {result.dream.length > 0 ? (
                   result.dream.map(renderSchoolCard)
                 ) : (
                   <div className="p-4 text-center text-gray-400 text-xs bg-gray-50 rounded-lg">無推薦夢幻校</div>
                 )}
              </div>

              {/* Match Schools */}
              <div className="space-y-4">
                 <div className="flex items-center gap-2 text-green-600 font-bold border-b border-green-100 pb-2">
                   <CheckCircle size={18} />
                   <h3>合適 (Match)</h3>
                   <span className="text-xs font-normal text-gray-400 ml-auto">主力申請</span>
                 </div>
                 {result.match.length > 0 ? (
                   result.match.map(renderSchoolCard)
                 ) : (
                   <div className="p-4 text-center text-gray-400 text-xs bg-gray-50 rounded-lg">無推薦合適校</div>
                 )}
              </div>

              {/* Safety Schools */}
              <div className="space-y-4">
                 <div className="flex items-center gap-2 text-blue-500 font-bold border-b border-blue-100 pb-2">
                   <AlertCircle size={18} />
                   <h3>保底 (Safety)</h3>
                   <span className="text-xs font-normal text-gray-400 ml-auto">低風險</span>
                 </div>
                 {result.safety.length > 0 ? (
                   result.safety.map(renderSchoolCard)
                 ) : (
                   <div className="p-4 text-center text-gray-400 text-xs bg-gray-50 rounded-lg">無推薦保底校</div>
                 )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200 p-12">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
               <Target size={40} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-600">等待分析</h3>
            <p className="text-sm mt-2 max-w-sm text-center">
              請在左側輸入學生成績與偏好，AI 將會從現有的 {schools.length} 所合作院校資料庫中，為您篩選最佳落點。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolPlacement;
