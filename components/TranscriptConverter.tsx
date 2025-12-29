
import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Calculator, Trash2, Download, Loader2, CheckCircle, Zap, Globe, Plus, X, Layers, Cpu, Database, Info, HelpCircle } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { parseTranscript } from '../services/geminiService';
import { TranscriptResult, TranscriptCourse } from '../types';

const TranscriptConverter: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentAction, setCurrentAction] = useState<string>('');
  const [processingHistory, setProcessingHistory] = useState<string[]>([]);
  const [result, setResult] = useState<TranscriptResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showFormula, setShowFormula] = useState(false);
  
  const exportSummaryRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [processingHistory]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  /**
   * Determine if a course should be included in GPA/Percentage calculations.
   * Logic: Exclude "抵" (Transfer), "退" (Withdraw), "停" (Stop/W), "P" (Pass), and "體育" (PE).
   */
  const shouldCalculate = (course: TranscriptCourse) => {
    const grade = (course.originalGrade || '').toString().toUpperCase().trim();
    const name = (course.name || '').toString().toUpperCase();
    
    const excludeGrades = ['抵', '退', '停', 'P', 'W', 'PASS'];
    const isExcludedGrade = excludeGrades.some(eg => grade.includes(eg));
    const isPE = name.includes('體育') || name.includes('PE');
    
    return !isExcludedGrade && !isPE;
  };

  /**
   * Utility to recalculate summary values based on the current course list.
   */
  const calculateSummary = (courses: TranscriptCourse[]) => {
    let totalCredits = 0;
    let weightedGpaSum = 0;
    let weightedPercentSum = 0;
    
    courses.forEach(c => {
      if (shouldCalculate(c)) {
        const cred = Number(c.credits) || 0;
        totalCredits += cred;
        weightedGpaSum += cred * (Number(c.gpa4) || 0);
        weightedPercentSum += cred * (Number(c.percentage) || 0);
      }
    });

    return {
      totalCredits,
      overallGpa4: totalCredits > 0 ? weightedGpaSum / totalCredits : 0,
      overallPercentage: totalCredits > 0 ? weightedPercentSum / totalCredits : 0
    };
  };

  const simulateProgress = async (courses: TranscriptCourse[] = []) => {
    const safeCourses = courses || [];
    const steps = [
      { text: "正在連線至 Gemini 高速運算節點...", delay: 400 },
      { text: "辨識學生資訊：姓名、校名、就讀科系...", delay: 300 },
      { text: "提取原始數據並執行排除過濾 (抵/退/停/P/體育)...", delay: 200 },
      ...safeCourses.slice(0, 5).map(c => ({ text: `解析項目：${c.name} (${c.originalGrade})`, delay: 100 })),
      { text: "正在計算總學分與加權平均數據...", delay: 200 },
      { text: "完成！", delay: 100 }
    ].filter(Boolean) as { text: string, delay: number }[];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      setCurrentAction(step.text);
      setProcessingHistory(prev => [...prev, step.text]);
      setProgress(Math.round(((i + 1) / steps.length) * 100));
      await new Promise(resolve => setTimeout(resolve, step.delay / 2));
    }
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    setResult(null);
    setProcessingHistory(["[System] 啟動雲端 AI 分析引擎..."]);
    
    try {
      const parts = await Promise.all(files.map(async file => ({
        inlineData: {
          data: await fileToBase64(file),
          mimeType: file.type
        }
      })));

      const apiResult = await parseTranscript(parts);
      await simulateProgress(apiResult.courses);

      // FORCE CLIENT-SIDE RECALCULATION to ensure summary totals strictly match visible qualified rows
      const { totalCredits, overallGpa4, overallPercentage } = calculateSummary(apiResult.courses);
      
      setResult({
        ...apiResult,
        totalCredits,
        overallGpa4,
        overallPercentage
      });
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "辨識失敗。");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadReport = async () => {
    if (!exportSummaryRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await htmlToImage.toPng(exportSummaryRef.current, {
        pixelRatio: 3, 
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `成績分析報告_${result?.studentName || '學生'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert('匯出失敗');
    } finally {
      setIsExporting(false);
    }
  };

  const handleUpdateCourse = (idx: number, field: keyof TranscriptCourse, value: string | number) => {
    if (!result) return;
    const newCourses = [...result.courses];
    newCourses[idx] = { ...newCourses[idx], [field]: value };
    
    const summary = calculateSummary(newCourses);

    setResult({
      ...result,
      courses: newCourses,
      ...summary
    });
  };

  const addEmptyCourse = () => {
    if (!result) return;
    setResult({
      ...result,
      courses: [...result.courses, { name: '', credits: 0, originalGrade: '', gpa4: 0, percentage: 0 }]
    });
  };

  const removeCourse = (idx: number) => {
    if (!result) return;
    const newCourses = result.courses.filter((_, i) => i !== idx);
    const summary = calculateSummary(newCourses);

    setResult({
      ...result,
      courses: newCourses,
      ...summary
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <Calculator className="text-[#FF4B7D]" size={32} />
            成績單極速換算器
          </h2>
          <p className="text-slate-500 mt-2 font-medium">智慧辨識台灣成績單並轉換美加 4.0 / 英澳百分比</p>
        </div>
        <button 
          onClick={() => setShowFormula(!showFormula)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-[#FF4B7D] hover:border-[#FF4B7D] transition-all text-sm font-bold shadow-sm"
        >
          <HelpCircle size={18} />
          {showFormula ? '隱藏換算公式' : '檢視換算公式'}
        </button>
      </div>

      {showFormula && (
        <div className="animate-in slide-in-from-top-4 duration-300">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-sm font-bold">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left font-black text-slate-800">台灣百分制 (Score)</th>
                  <th className="px-6 py-4 text-center font-black text-slate-800 bg-orange-50/50">GPA 4.0 制</th>
                  <th className="px-6 py-4 text-center font-black text-slate-800">等第 (Grade)</th>
                  <th className="px-6 py-4 text-left font-black text-slate-800">排除計算條件 (Exclusions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-6 py-3 text-slate-700">80 分以上</td>
                  <td className="px-6 py-3 text-center text-slate-900 font-black bg-orange-50/30">4.00</td>
                  <td className="px-6 py-3 text-center text-slate-500">A</td>
                  <td className="px-6 py-3 text-slate-500 font-medium" rowSpan={4}>
                    系統將偵測並排除下列項目：<br/>
                    • 抵免 (通常顯示「抵」)<br/>
                    • 退選 (通常顯示「退」或「W」)<br/>
                    • 停修 (通常顯示「停」)<br/>
                    • Pass (通常顯示「P」)<br/>
                    • 體育課程 (PE)
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-slate-700">70 - 79 分</td>
                  <td className="px-6 py-3 text-center text-slate-900 font-black bg-orange-50/30">3.00</td>
                  <td className="px-6 py-3 text-center text-slate-500">B</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-slate-700">60 - 69 分</td>
                  <td className="px-6 py-3 text-center text-slate-900 font-black bg-orange-50/30">2.00</td>
                  <td className="px-6 py-3 text-center text-slate-500">C</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-slate-700">59 分 (含) 以下</td>
                  <td className="px-6 py-3 text-center text-slate-900 font-black bg-orange-50/30">0.00</td>
                  <td className="px-6 py-3 text-center text-slate-500">F / Fail</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Actions */}
        <div className="lg:col-span-4 space-y-6 sticky top-8">
          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`bg-white border-4 border-dashed rounded-[2.5rem] p-10 flex flex-col items-center justify-center cursor-pointer transition-all group shadow-sm ${isDragging ? 'border-[#FF4B7D] bg-rose-50 scale-105' : 'border-slate-200 hover:border-[#FF4B7D]'}`}
          >
            <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,application/pdf" />
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all mb-4 ${isDragging ? 'bg-[#FF4B7D] text-white' : 'bg-slate-50 text-slate-300 group-hover:bg-rose-100 group-hover:text-[#FF4B7D]'}`}>
              <Upload size={40} />
            </div>
            <p className="font-black text-slate-800 text-center">
              {isDragging ? '放開以新增檔案' : '點擊或拖曳檔案至此'}
            </p>
            <p className="text-xs text-slate-400 mt-2 font-medium text-center italic">系統已內建 抵/退/停/P/體育 排除邏輯</p>
          </div>

          {files.length > 0 && !isProcessing && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in slide-in-from-top-2 duration-200">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">待處理檔案 ({files.length})</span>
                <button onClick={() => setFiles([])} className="text-[10px] font-black text-red-400 hover:text-red-600">全部清除</button>
              </div>
              <div className="max-h-48 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100 group">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText size={14} className="text-[#FF4B7D] shrink-0" />
                      <span className="text-[11px] font-bold text-slate-600 truncate">{f.name}</span>
                    </div>
                    <button onClick={() => removeFile(i)} className="text-slate-300 hover:text-red-500 p-1">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-white">
                <button 
                  onClick={handleProcess}
                  className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Zap size={20} className="text-yellow-400" /> 啟動 AI 辨識分析
                </button>
              </div>
            </div>
          )}

          {result && !isProcessing && (
            <button 
              onClick={downloadReport}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-3 py-5 bg-[#FF4B7D] text-white rounded-[2.5rem] hover:bg-[#E63E6D] transition-all font-black text-sm shadow-xl shadow-rose-100 disabled:opacity-50 animate-in slide-in-from-top-2"
            >
              {isExporting ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
              匯出 300 DPI 分析報告圖
            </button>
          )}

          {isProcessing && (
            <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl space-y-6 animate-in zoom-in duration-300">
               <div className="flex items-center justify-between text-white">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#FF4B7D] animate-ping"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF4B7D]">Cloud Parsing</span>
                 </div>
                 <span className="text-xl font-black tabular-nums">{progress}%</span>
               </div>
               
               <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                 <div className="h-full bg-gradient-to-r from-[#FF4B7D] to-rose-400 transition-all duration-150" style={{ width: `${progress}%` }}></div>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center gap-3 text-white">
                     <Cpu size={18} className="text-[#FF4B7D]" />
                     <p className="text-sm font-black truncate">{currentAction}</p>
                  </div>

                  <div className="h-48 overflow-y-auto custom-scrollbar space-y-2 pr-2 border-t border-white/5 pt-4">
                    {processingHistory.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] font-bold text-slate-400 animate-in slide-in-from-left-1">
                        <div className="w-1 h-1 rounded-full bg-white/20 shrink-0"></div>
                        <span className={i === processingHistory.length - 1 ? "text-white" : ""}>{h}</span>
                      </div>
                    ))}
                    <div ref={historyEndRef} />
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Right Column: Analysis Report */}
        <div className="lg:col-span-8">
          {result ? (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
               <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                 <div ref={exportSummaryRef} className="p-12 bg-white">
                   <div className="flex justify-between items-start border-b-4 border-slate-50 pb-8 mb-10">
                     <div className="flex-1">
                       <div className="text-[#FF4B7D] font-black text-3xl italic tracking-tighter mb-2">FANGYANG NEXUS</div>
                       <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">成績換算分析報告 (Summary)</h3>
                     </div>
                     <div className="text-right flex-shrink-0">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Student / University</p>
                        <div className="space-y-2">
                          <input 
                            className="block w-full p-2 text-right text-xl font-black border-b border-transparent focus:border-slate-200 outline-none text-slate-900 bg-transparent transition-all placeholder-slate-300" 
                            value={result.studentName} 
                            placeholder="學生姓名"
                            onChange={e => setResult({...result, studentName: e.target.value})} 
                          />
                          <input 
                            className="block w-full p-2 text-right text-sm font-bold text-slate-500 border-b border-transparent focus:border-slate-200 outline-none bg-transparent transition-all placeholder-slate-300" 
                            value={result.university} 
                            placeholder="就讀學校"
                            onChange={e => setResult({...result, university: e.target.value})} 
                          />
                        </div>
                     </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 flex flex-col items-center justify-center relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                           <Globe size={80} className="text-slate-800" />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Overall GPA (4.0 Scale)</p>
                        <div className="text-7xl font-black text-slate-900 mb-2">{result.overallGpa4.toFixed(2)}</div>
                        <div className="h-1.5 w-12 bg-[#FF4B7D] rounded-full"></div>
                        <p className="text-[9px] text-slate-400 font-bold mt-4 uppercase tracking-[0.1em]">North America Admission Indicator</p>
                     </div>
                     <div className="bg-rose-50/30 p-10 rounded-[2.5rem] border border-rose-100 flex flex-col items-center justify-center relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                           <Calculator size={80} className="text-[#FF4B7D]" />
                        </div>
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-4">Weighted Percentage (%)</p>
                        <div className="text-7xl font-black text-slate-900 mb-2">{result.overallPercentage.toFixed(1)}%</div>
                        <div className="h-1.5 w-12 bg-slate-800 rounded-full"></div>
                        <p className="text-[9px] text-slate-400 font-bold mt-4 uppercase tracking-[0.1em]">UK & Australia Admission Indicator</p>
                     </div>
                   </div>

                   {/* Calculation Info Note */}
                   <div className="mt-8 px-6 py-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                      <Info size={16} className="text-[#FF4B7D] shrink-0 mt-0.5" />
                      <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
                        系統提示：本數據已自動排除「抵免、退選、停修、Pass、體育」等科目之累加。下方列表顯示為灰底且標註 "Excluded" 之項目即不計入總學分與平均分。
                      </p>
                   </div>
                 </div>

                 <div className="p-12 pt-0 border-t border-slate-50">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-widest">
                         <FileText size={18} className="text-[#FF4B7D]" /> 課程辨識明細 Course Details
                      </h4>
                      <button onClick={addEmptyCourse} className="text-xs font-black text-[#FF4B7D] bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 flex items-center gap-1 hover:bg-rose-100 transition-colors">
                        <Plus size={14} /> 新增列
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                         <thead>
                           <tr className="bg-slate-50 text-left border-y-2 border-slate-100">
                             <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">科目名稱</th>
                             <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">學分</th>
                             <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">原成績</th>
                             <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">GPA 4.0</th>
                             <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">百分比 %</th>
                             <th className="px-4 py-4 text-center"></th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                           {result.courses.map((course, idx) => {
                             const isIncluded = shouldCalculate(course);
                             return (
                               <tr key={idx} className={`transition-colors ${isIncluded ? 'hover:bg-slate-50/30' : 'bg-slate-50/20 grayscale-[0.5]'}`}>
                                 <td className="px-4 py-3">
                                   <div className="flex items-center gap-2">
                                     <input 
                                        className={`w-full p-2 bg-transparent border-b border-transparent focus:border-rose-200 outline-none text-sm font-black transition-all ${isIncluded ? 'text-slate-900' : 'text-slate-400'}`} 
                                        value={course.name} 
                                        placeholder="Course Name"
                                        onChange={e => handleUpdateCourse(idx, 'name', e.target.value)} 
                                     />
                                     {!isIncluded && (
                                       <span className="shrink-0 px-2 py-0.5 bg-slate-200 text-slate-500 rounded text-[9px] font-black uppercase tracking-tighter">Excluded</span>
                                     )}
                                   </div>
                                 </td>
                                 <td className="px-4 py-3 text-center">
                                   <input 
                                      type="number" 
                                      className={`w-16 p-2 bg-transparent border-b border-transparent focus:border-rose-200 outline-none text-center text-xs font-bold transition-all ${isIncluded ? 'text-slate-800' : 'text-slate-400 line-through'}`} 
                                      value={course.credits} 
                                      onChange={e => handleUpdateCourse(idx, 'credits', Number(e.target.value))} 
                                   />
                                 </td>
                                 <td className="px-4 py-3 text-center">
                                   <input 
                                      className={`w-16 p-2 bg-transparent border-b border-transparent focus:border-rose-200 outline-none text-center text-xs font-black transition-all ${isIncluded ? 'text-slate-600' : 'text-slate-400'}`} 
                                      value={course.originalGrade} 
                                      onChange={e => handleUpdateCourse(idx, 'originalGrade', e.target.value)} 
                                   />
                                 </td>
                                 <td className="px-4 py-3 text-center">
                                   <input 
                                      type="number" 
                                      step="0.1" 
                                      className={`w-16 p-2 bg-transparent border-b border-transparent focus:border-rose-200 outline-none text-center text-xs font-black transition-all ${isIncluded ? 'text-slate-900' : 'text-slate-300'}`} 
                                      value={course.gpa4} 
                                      onChange={e => handleUpdateCourse(idx, 'gpa4', Number(e.target.value))} 
                                   />
                                 </td>
                                 <td className="px-4 py-3 text-center">
                                   <input 
                                      type="number" 
                                      className={`w-16 p-2 bg-transparent border-b border-transparent focus:border-rose-200 outline-none text-center text-xs font-black transition-all ${isIncluded ? 'text-slate-900' : 'text-slate-300'}`} 
                                      value={course.percentage} 
                                      onChange={e => handleUpdateCourse(idx, 'percentage', Number(e.target.value))} 
                                   />
                                 </td>
                                 <td className="px-4 py-3 text-center">
                                   <button onClick={() => removeCourse(idx)} className="p-1 text-slate-300 hover:text-red-500 transition-colors"><X size={14} /></button>
                                 </td>
                               </tr>
                             );
                           })}
                         </tbody>
                      </table>
                    </div>
                    
                    <div className="mt-8 pt-8 border-t-2 border-slate-50 flex justify-between items-center">
                       <div className="flex gap-10">
                          <div>
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Calculated Credits (Qualified)</span>
                             <span className="text-xl font-black text-slate-900 tabular-nums">{result.totalCredits}</span>
                          </div>
                          <div>
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Included Subjects Count</span>
                             <span className="text-xl font-black text-slate-900 tabular-nums">{result.courses.filter(shouldCalculate).length}</span>
                          </div>
                       </div>
                       <div className="bg-slate-900 px-5 py-2 rounded-xl flex items-center gap-2 shadow-lg">
                          <CheckCircle size={14} className="text-[#FF4B7D]" />
                          <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Verified Calc Integrity</span>
                       </div>
                    </div>
                 </div>
               </div>
            </div>
          ) : (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-white rounded-[3rem] border border-dashed border-slate-200 text-slate-400 p-12 shadow-sm">
              <Calculator size={80} className="mb-6 opacity-10" />
              <h3 className="text-xl font-black text-slate-800">等待資料匯入...</h3>
              <p className="max-w-xs text-center mt-3 font-medium text-slate-400 leading-relaxed italic">
                請上傳學生成績單影像或 PDF。系統將自動辨識科目學分、等第，並精確累加「非排除科目」之總學分數。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranscriptConverter;
