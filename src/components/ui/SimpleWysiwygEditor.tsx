// src/components/ui/SimpleWysiwygEditor.tsx
import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Code } from 'lucide-react';

const TOOLBTN_CLS = "p-2 rounded-lg border border-white/10 bg-white/5 text-sm hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed";

type WysiwygButtonProps = {
  cmd: string;
  arg?: string;
  icon: React.ReactNode;
  title: string;
}

const WysiwygButton = ({ cmd, arg, icon, title }: WysiwygButtonProps) => {
  const handleExec = (e: React.MouseEvent) => {
    e.preventDefault();
    document.execCommand(cmd, false, arg);
  };
  
  return (
    <button
      type="button"
      onMouseDown={handleExec}
      className={TOOLBTN_CLS}
      title={title}
    >
      {icon}
    </button>
  );
};


type SimpleWysiwygEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

export const SimpleWysiwygEditor = ({ value, onChange, placeholder }: SimpleWysiwygEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== value) {
      editor.innerHTML = value;
    }
  }, [value]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    onChange(e.currentTarget.innerHTML);
  };
  
  return (
    <div className="rounded-xl border border-white/15 bg-black/[.15] focus-within:ring-2 focus-within:ring-[var(--accent)]/50">
      <div className="p-2 border-b border-white/15 flex flex-wrap gap-1">
        <WysiwygButton cmd="bold" icon={<Bold size={16} />} title="Жирный" />
        <WysiwygButton cmd="italic" icon={<Italic size={16} />} title="Курсив" />
        <WysiwygButton cmd="formatBlock" arg="h2" icon={<Heading2 size={16} />} title="Заголовок 2" />
        <WysiwygButton cmd="formatBlock" arg="h3" icon={<Heading3 size={16} />} title="Заголовок 3" />
        <WysiwygButton cmd="insertUnorderedList" icon={<List size={16} />} title="Маркированный список" />
        <WysiwygButton cmd="insertOrderedList" icon={<ListOrdered size={16} />} title="Нумерованный список" />
        <WysiwygButton cmd="formatBlock" arg="blockquote" icon={<Quote size={16} />} title="Цитата" />
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder}
        className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-h2:my-2 prose-h3:my-1 min-h-[250px] p-4 outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:opacity-80"
      />
    </div>
  );
};