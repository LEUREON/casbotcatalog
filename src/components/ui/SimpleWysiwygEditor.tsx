import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Bold, Italic, Eraser, Check, FileStack } from 'lucide-react';

const TOOLBTN_CLS = "p-2 rounded-lg border border-white/10 bg-white/5 text-sm hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed";

const WysiwygButton = ({ onClick, title, children }: { onClick: (e: React.MouseEvent) => void, title: string, children: React.ReactNode }) => (
  <button type="button" onMouseDown={onClick} title={title} className={TOOLBTN_CLS}>
    {children}
  </button>
);

type SimpleWysiwygEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

export const SimpleWysiwygEditor = ({ value, onChange, placeholder }: SimpleWysiwygEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [customFontSize, setCustomFontSize] = useState('16');

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== value) {
      editor.innerHTML = value;
    }
  }, [value]);
  
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const execCmd = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg);
    editorRef.current?.focus();
    handleInput();
  };
  
  // ✅ НАЧАЛО: Новая, полностью переписанная и надежная функция для изменения размера шрифта
  const applyCustomFontSize = (e: React.MouseEvent) => {
    e.preventDefault();
    const size = parseInt(customFontSize, 10);
    if (isNaN(size) || size <= 0) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    // Функция для очистки старых стилей размера
    const cleanupFontSize = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.style.fontSize) {
            el.style.fontSize = '';
        }
        // Если после удаления стиля не осталось других, убираем атрибут
        if (!el.getAttribute('style')) {
            el.removeAttribute('style');
        }
        // Если это пустой span, заменяем его его содержимым
        if (el.tagName === 'SPAN' && !el.attributes.length) {
            el.replaceWith(...el.childNodes);
        }
      }
    };
    
    // Рекурсивная функция для применения нового стиля
    const applyStyleToRange = (currentRange: Range) => {
        const contents = currentRange.extractContents();
        const walker = document.createTreeWalker(contents, NodeFilter.SHOW_ELEMENT);
        
        while (walker.nextNode()) {
            cleanupFontSize(walker.currentNode);
        }

        const newSpan = document.createElement('span');
        newSpan.style.fontSize = `${size}px`;
        newSpan.appendChild(contents);
        currentRange.insertNode(newSpan);
    };

    applyStyleToRange(range);

    selection.removeAllRanges();
    editorRef.current?.normalize();
    handleInput();
    editorRef.current?.focus();
  };
  // ✅ КОНЕЦ

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    handleInput();
  }, [handleInput]);

  const handleSelectAll = (e: React.MouseEvent) => {
    e.preventDefault();
    const editor = editorRef.current;
    if (editor) {
      const range = document.createRange();
      range.selectNodeContents(editor);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      editor.focus();
    }
  };

  return (
    <div className="rounded-xl border border-white/15 bg-black/[.15] focus-within:ring-2 focus-within:ring-[var(--accent)]/50">
      <div className="p-2 border-b border-white/15 flex flex-wrap gap-1 items-center">
        <WysiwygButton onClick={() => execCmd('bold')} title="Жирный"><Bold size={16} /></WysiwygButton>
        <WysiwygButton onClick={() => execCmd('italic')} title="Курсив"><Italic size={16} /></WysiwygButton>
        
        <div className="flex items-center border border-white/10 rounded-lg bg-white/5">
          <input
            type="number"
            value={customFontSize}
            onChange={(e) => setCustomFontSize(e.target.value)}
            className="bg-transparent w-16 p-2 text-center outline-none"
            placeholder="16"
          />
          <button onClick={applyCustomFontSize} title="Применить размер" className="pr-2 text-[var(--accent-primary)] hover:text-white">
            <Check size={18} />
          </button>
        </div>
        
        <WysiwygButton onClick={() => execCmd('removeFormat')} title="Очистить форматирование"><Eraser size={16} /></WysiwygButton>
        <WysiwygButton onClick={handleSelectAll} title="Выделить всё">
            <FileStack size={16} />
        </WysiwygButton>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-h2:my-2 prose-h3:my-1 min-h-[250px] p-4 outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:opacity-80"
      />
    </div>
  );
};