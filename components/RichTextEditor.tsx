import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Heading1, Heading2, Heading3, Type } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className }) => {
  const contentEditableRef = useRef<HTMLDivElement>(null);
  
  // Track composition state for IME (Chinese/Japanese input)
  const isComposing = useRef(false);
  
  // Track the last emitted HTML to avoid unnecessary updates
  // Initialize as null to ensure the first render triggers a DOM update
  const lastEmittedHtml = useRef<string | null>(null);

  // Store selection range to restore after DOM updates (if possible)
  const lastRange = useRef<Range | null>(null);

  // Local state to control placeholder visibility
  const [showPlaceholder, setShowPlaceholder] = useState(!value || value === '<br>' || value === '<p><br></p>');

  // --- Selection Management ---

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

  // --- Event Handlers ---

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
        
        // Save selection before potential updates
        saveSelection();

        // Only emit changes if not currently composing (IME)
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
        // Restore selection ensures cursor stays at the end of inserted IME text
        restoreSelection();
    }
  };

  // --- Synchronization Effect ---

  useEffect(() => {
    // Update placeholder state
    const isEmpty = !value || value === '<br>' || value === '<p><br></p>';
    setShowPlaceholder(isEmpty);

    if (!contentEditableRef.current) return;

    // 1. Check if update is necessary:
    // If value matches what we last emitted, it's an echo -> Skip.
    // If DOM already matches value, it's redundant -> Skip.
    if (value === lastEmittedHtml.current || contentEditableRef.current.innerHTML === value) {
      return;
    }

    // 2. If valid external update, apply it.
    saveSelection(); 
    
    contentEditableRef.current.innerHTML = value;

    // Note: restoring selection here might fail if nodes were replaced, 
    // but the guard clause above prevents most cursor-interrupting updates while typing.
    restoreSelection();

    // Sync ref
    lastEmittedHtml.current = value;
  }, [value]);


  // --- Toolbar Commands ---

  const execCommand = (command: string, cmdValue: string | undefined = undefined) => {
    document.execCommand(command, false, cmdValue);
    if (contentEditableRef.current) {
      const html = contentEditableRef.current.innerHTML;
      emitChange(html);
      contentEditableRef.current.focus();
    }
  };

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden bg-white flex flex-col relative ${className}`}>
      {/* Toolbar */}
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
        <ToolbarButton icon={<AlignLeft size={18}/>} onClick={() => execCommand('justifyLeft')} label="靠左" />
        <ToolbarButton icon={<AlignCenter size={18}/>} onClick={() => execCommand('justifyCenter')} label="置中" />
        <ToolbarButton icon={<AlignRight size={18}/>} onClick={() => execCommand('justifyRight')} label="靠右" />
        <div className="w-px h-5 bg-gray-300 mx-1" />
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

const ToolbarButton = ({ icon, onClick, label }: any) => (
  <button 
    onClick={(e) => { e.preventDefault(); onClick(); }}
    className="p-1.5 text-gray-600 hover:bg-gray-200 hover:text-black rounded transition-colors"
    title={label}
    type="button"
  >
    {icon}
  </button>
);
