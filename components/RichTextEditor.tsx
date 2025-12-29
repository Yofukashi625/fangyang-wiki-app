import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Heading1, Heading2, Heading3, Type, Palette, Link as LinkIcon, Image as ImageIcon, Eraser } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const COLORS = [
    '#000000', '#FF0000', '#0000FF', '#008000', '#FFA500', 
    '#800080', '#00FFFF', '#FFC0CB', '#808080'
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className }) => {
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isComposing = useRef(false);
  const lastEmittedHtml = useRef<string | null>(null);
  const lastRange = useRef<Range | null>(null);

  const [showPlaceholder, setShowPlaceholder] = useState(!value || value === '<br>' || value === '<p><br></p>');

  // --- Selection Management ---

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      lastRange.current = selection.getRangeAt(0).cloneRange();
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

  // --- Image Processing Helper ---

  const processAndResizeImage = (file: File, maxWidth = 1024): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject('Could not get canvas context');
          
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  // --- Handlers ---

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

  // --- Optimized Paste Handling ---
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    // 獲取貼上的 HTML 內容或純文字
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');

    if (html) {
      // 建立一個暫時的 DOM 來過濾危險標籤與行內樣式
      const template = document.createElement('div');
      template.innerHTML = html;
      
      // 遞迴清理所有節點的樣式與屬性，僅保留基礎標籤
      const cleanNode = (node: Node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          // 移除所有屬性，除了 <a> 的 href
          const attrs = el.attributes;
          for (let i = attrs.length - 1; i >= 0; i--) {
            const attrName = attrs[i].name;
            if (attrName !== 'href' && attrName !== 'target') {
              el.removeAttribute(attrName);
            }
          }
          // 如果是 <a> 則強制新視窗開啟
          if (el.tagName === 'A') {
            el.setAttribute('target', '_blank');
            el.setAttribute('rel', 'noopener noreferrer');
          }
        }
        node.childNodes.forEach(cleanNode);
      };
      
      cleanNode(template);
      document.execCommand('insertHTML', false, template.innerHTML);
    } else {
      // 如果沒有 HTML，則直接插入純文字
      document.execCommand('insertText', false, text);
    }
    handleInput();
  };

  useEffect(() => {
    const isEmpty = !value || value === '<br>' || value === '<p><br></p>';
    setShowPlaceholder(isEmpty);

    if (!contentEditableRef.current) return;

    if (value === lastEmittedHtml.current || contentEditableRef.current.innerHTML === value) {
      return;
    }

    saveSelection(); 
    contentEditableRef.current.innerHTML = value;
    restoreSelection();
    lastEmittedHtml.current = value;
  }, [value]);

  // --- Core Commands ---

  const execCommand = (command: string, cmdValue: string | undefined = undefined) => {
    if (!contentEditableRef.current) return;
    contentEditableRef.current.focus();
    restoreSelection();
    
    // 如果是標題命令，先嘗試清除格式確保標籤能正確替換
    if (command === 'formatBlock' && (cmdValue?.startsWith('H') || cmdValue === 'P')) {
      document.execCommand('removeFormat', false, undefined);
    }
    
    document.execCommand(command, false, cmdValue);
    saveSelection();
    handleInput();
  };

  const handleClearFormat = () => {
    if (!contentEditableRef.current) return;
    contentEditableRef.current.focus();
    restoreSelection();
    // 清除行內樣式
    document.execCommand('removeFormat', false, undefined);
    // 強制轉回段落標籤
    document.execCommand('formatBlock', false, 'P');
    saveSelection();
    handleInput();
  };

  const handleInsertLink = (e: React.MouseEvent | KeyboardEvent) => {
    if (e instanceof MouseEvent) e.preventDefault();
    
    saveSelection();
    
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : "";
    const urlPattern = /^(https?:\/\/[^\s]+)$|^(www\.[^\s]+)$/;
    
    if (urlPattern.test(selectedText)) {
      let finalUrl = selectedText;
      if (selectedText.startsWith('www.')) {
        finalUrl = 'https://' + selectedText;
      }
      
      restoreSelection();
      document.execCommand('insertHTML', false, `<a href="${finalUrl}" target="_blank" rel="noopener noreferrer">${selectedText}</a>`);
      handleInput();
      return;
    }
    
    const url = prompt("請輸入連結網址 (URL):", "https://");
    if (url) {
      restoreSelection();
      
      const selection = window.getSelection();
      if (selection && (selection.isCollapsed || !selection.toString().trim()) && contentEditableRef.current) {
        document.execCommand('insertHTML', false, `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
      } else {
        const currentSelected = selection?.toString() || url;
        document.execCommand('insertHTML', false, `<a href="${url}" target="_blank" rel="noopener noreferrer">${currentSelected}</a>`);
      }
      
      handleInput();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const optimizedBase64 = await processAndResizeImage(file);
        execCommand('insertImage', optimizedBase64);
        
        setTimeout(() => {
          if (contentEditableRef.current) {
            const images = contentEditableRef.current.querySelectorAll('img');
            images.forEach(img => {
              if (!img.classList.contains('editor-img')) {
                img.classList.add('editor-img', 'max-w-full', 'h-auto', 'rounded-lg', 'my-4', 'shadow-md', 'block');
              }
            });
            handleInput();
          }
        }, 50);
      } catch (err) {
        console.error("Image optimization failed", err);
        alert("圖片處理失敗，請嘗試其他檔案。");
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handleInsertLink(e);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden bg-white flex flex-col relative ${className}`}>
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleImageUpload} 
      />

      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 shrink-0 z-10 relative">
        <ToolbarButton icon={<Heading1 size={18}/>} onClick={() => execCommand('formatBlock', 'H1')} label="標題 1" />
        <ToolbarButton icon={<Heading2 size={18}/>} onClick={() => execCommand('formatBlock', 'H2')} label="標題 2" />
        <ToolbarButton icon={<Heading3 size={18}/>} onClick={() => execCommand('formatBlock', 'H3')} label="標題 3" />
        <ToolbarButton icon={<Type size={18}/>} onClick={() => execCommand('formatBlock', 'P')} label="內文" />
        <div className="w-px h-5 bg-gray-300 mx-1" />
        
        <ToolbarButton icon={<Bold size={18}/>} onClick={() => execCommand('bold')} label="粗體" />
        <ToolbarButton icon={<Italic size={18}/>} onClick={() => execCommand('italic')} label="斜體" />
        <ToolbarButton icon={<Underline size={18}/>} onClick={() => execCommand('underline')} label="底線" />
        <div className="w-px h-5 bg-gray-300 mx-1" />

        <ColorDropdown onSelectColor={(color) => execCommand('foreColor', color)} />
        <ToolbarButton icon={<LinkIcon size={18}/>} onClick={() => handleInsertLink({} as any)} label="插入連結 (Ctrl+K)" />
        <ToolbarButton icon={<ImageIcon size={18}/>} onClick={() => fileInputRef.current?.click()} label="插入圖片" />
        
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <ToolbarButton icon={<Eraser size={18}/>} onClick={handleClearFormat} label="清除所有格式" />

        <div className="w-px h-5 bg-gray-300 mx-1" />
        <ToolbarButton icon={<AlignLeft size={18}/>} onClick={() => execCommand('justifyLeft')} label="靠左" />
        <ToolbarButton icon={<AlignCenter size={18}/>} onClick={() => execCommand('justifyCenter')} label="置中" />
        <ToolbarButton icon={<AlignRight size={18}/>} onClick={() => execCommand('justifyRight')} label="靠右" />
        
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <ToolbarButton icon={<List size={18}/>} onClick={() => execCommand('insertUnorderedList')} label="項目符號" />
        <ToolbarButton icon={<ListOrdered size={18}/>} onClick={() => execCommand('insertOrderedList')} label="編號清單" />
      </div>
      
      <div className="flex-1 relative overflow-hidden">
         {showPlaceholder && placeholder && (
           <div className="absolute top-4 left-4 text-gray-400 pointer-events-none select-none z-0">
             {placeholder}
           </div>
         )}

        <div
          ref={contentEditableRef}
          className="w-full h-full p-4 overflow-auto outline-none prose prose-slate max-w-none focus:ring-2 focus:ring-inset focus:ring-transparent min-h-[300px] relative z-0 text-gray-900"
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          onPaste={handlePaste}
          onMouseUp={saveSelection}
          onKeyUp={saveSelection}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
        />
      </div>
    </div>
  );
};

const ToolbarButton = ({ icon, onClick, label }: { icon: React.ReactNode, onClick: () => void, label: string }) => (
  <button 
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