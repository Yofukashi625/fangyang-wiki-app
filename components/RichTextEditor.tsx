import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Heading1, Heading2, Heading3, Type, Palette } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// 顏色選項
const COLORS = [
    '#000000', '#FF0000', '#0000FF', '#008000', '#FFA500', 
    '#800080', '#00FFFF', '#FFC0CB', '#808080'
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className }) => {
  const contentEditableRef = useRef<HTMLDivElement>(null);
  
  const isComposing = useRef(false);
  // FIX: Initialize as null to ensure the first render triggers a DOM update with the initial value
  const lastEmittedHtml = useRef<string | null>(null);
  const lastRange = useRef<Range | null>(null);

  const [showPlaceholder, setShowPlaceholder] = useState(!value || value === '<br>' || value === '<p><br></p>');

  // --- 游標/選區管理 ---

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      lastRange.current = selection.getRangeAt(0).cloneRange();
    } else {
      lastRange.current = null;
    }
  };

  const restoreSelection = () => {
    if (lastRange.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(lastRange.current);
      }
    }
  };


  // --- 事件處理與同步邏輯 ---

  const emitChange = useCallback((html: string) => {
    lastEmittedHtml.current = html;
    onChange(html);
  }, [onChange]);

  const handleInput = () => {
    if (contentEditableRef.current) {
        const html = contentEditableRef.current.innerHTML;
        const text = contentEditableRef.current.innerText.trim();
        const isEmpty = text.length === 0 && (html === '<br>' || html === '' || html === '<p><br></p>');
        setShowPlaceholder(isEmpty);
        
        saveSelection();

        if (!isComposing.current) {
            emitChange(html);
        }
    }
  };
  
  const handleCompositionStart = () => {
    isComposing.current = true;
    saveSelection(); 
  };

  const handleCompositionEnd = () => {
    isComposing.current = false;
    if (contentEditableRef.current) {
        handleInput();
        restoreSelection();
    }
  };

  useEffect(() => {
    const isEmpty = !value || value === '<br>' || value === '<p><br></p>';
    setShowPlaceholder(isEmpty);

    if (!contentEditableRef.current) return;

    // Check if update is needed. 
    // If lastEmittedHtml is null (first run), we MUST update DOM if value is present.
    if (value === lastEmittedHtml.current || contentEditableRef.current.innerHTML === value) {
      return;
    }

    saveSelection(); 
    
    contentEditableRef.current.innerHTML = value;

    restoreSelection();

    lastEmittedHtml.current = value;
  }, [value]);


  // --- 核心執行命令函式 (包含修正 H1/H2/H3 的關鍵) ---

  const execCommand = (command: string, cmdValue: string | undefined = undefined) => {
    if (!contentEditableRef.current) return;
    
    // 確保編輯器有焦點
    contentEditableRef.current.focus();

    // 儲存當前選區，以防 execCommand 執行時丟失
    saveSelection(); 
    
    // 執行命令
    document.execCommand(command, false, cmdValue);

    // 恢復選區 (對於 formatBlock，有時能幫助穩定光標)
    restoreSelection(); 

    // 命令執行後，DOM 內容已更改，需要同步給父元件
    const html = contentEditableRef.current.innerHTML;
    emitChange(html);
  };


  // --- 渲染 ---

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden bg-white flex flex-col relative ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 shrink-0 z-10 relative">
        {/* 標題/段落命令 (H1/H2/H3/P) */}
        <ToolbarButton icon={<Heading1 size={18}/>} onClick={() => execCommand('formatBlock', 'H1')} label="標題 1" />
        <ToolbarButton icon={<Heading2 size={18}/>} onClick={() => execCommand('formatBlock', 'H2')} label="標題 2" />
        <ToolbarButton icon={<Heading3 size={18}/>} onClick={() => execCommand('formatBlock', 'H3')} label="標題 3" />
        <ToolbarButton icon={<Type size={18}/>} onClick={() => execCommand('formatBlock', 'P')} label="內文" />
        <div className="w-px h-5 bg-gray-300 mx-1" />
        
        {/* 文字格式命令 */}
        <ToolbarButton icon={<Bold size={18}/>} onClick={() => execCommand('bold')} label="粗體" />
        <ToolbarButton icon={<Italic size={18}/>} onClick={() => execCommand('italic')} label="斜體" />
        <ToolbarButton icon={<Underline size={18}/>} onClick={() => execCommand('underline')} label="底線" />
        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* 新增：文字顏色選擇器 */}
        <ColorDropdown onSelectColor={(color) => execCommand('foreColor', color)} />
        <div className="w-px h-5 bg-gray-300 mx-1" />
        
        {/* 對齊命令 */}
        <ToolbarButton icon={<AlignLeft size={18}/>} onClick={() => execCommand('justifyLeft')} label="靠左" />
        <ToolbarButton icon={<AlignCenter size={18}/>} onClick={() => execCommand('justifyCenter')} label="置中" />
        <ToolbarButton icon={<AlignRight size={18}/>} onClick={() => execCommand('justifyRight')} label="靠右" />
        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* 清單命令 */}
        <ToolbarButton icon={<List size={18}/>} onClick={() => execCommand('insertUnorderedList')} label="項目符號" />
        <ToolbarButton icon={<ListOrdered size={18}/>} onClick={() => execCommand('insertOrderedList')} label="編號清單" />
      </div>
      
      {/* Editor Container */}
      <div className="flex-1 relative overflow-hidden">
         {/* Placeholder */}
         {showPlaceholder && placeholder && (
           <div className="absolute top-4 left-4 text-gray-400 pointer-events-none select-none z-0">
             {placeholder}
           </div>
         )}

        {/* Editable Area */}
        <div
          ref={contentEditableRef}
          className="w-full h-full p-4 overflow-auto outline-none prose prose-slate max-w-none focus:ring-2 focus:ring-inset focus:ring-transparent min-h-[300px] relative z-0 text-gray-900"
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
        />
      </div>
    </div>
  );
};

// --- 子元件 ---

const ToolbarButton = ({ icon, onClick, label }: { icon: React.ReactNode, onClick: () => void, label: string }) => (
  <button 
    // 阻止按鈕點擊時編輯器失去焦點
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className="p-1.5 text-gray-600 hover:bg-gray-200 hover:text-black rounded transition-colors"
    title={label}
    type="button"
  >
    {icon}
  </button>
);

const ColorDropdown: React.FC<{ onSelectColor: (color: string) => void }> = ({ onSelectColor }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 點擊外部關閉下拉選單
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSelect = (color: string) => {
        onSelectColor(color);
        setIsOpen(false);
    }
    
    // 阻止點擊按鈕時失去焦點，並切換選單狀態
    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsOpen(prev => !prev);
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onMouseDown={handleToggle}
                className="p-1.5 text-gray-600 hover:bg-gray-200 hover:text-black rounded transition-colors"
                title="文字顏色"
                type="button"
            >
                <Palette size={18} />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-1 left-0 z-20 w-32 p-1 bg-white border border-gray-300 rounded-lg shadow-xl flex flex-wrap gap-1">
                    {COLORS.map((color) => (
                        <div 
                            key={color}
                            onMouseDown={(e) => { 
                                // 阻止點擊顏色時失去焦點，讓編輯器保持活動
                                e.preventDefault(); 
                                handleSelect(color); 
                            }}
                            className="w-6 h-6 rounded cursor-pointer border border-gray-100 hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                            title={color}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
