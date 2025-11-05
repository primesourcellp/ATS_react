import { useEffect, useRef } from 'react';

const RichTextEditor = ({ value, onChange, placeholder = "Enter text...", minHeight = '200px' }) => {
  const editorRef = useRef(null);

  const syncFromValue = () => {
    if (!editorRef.current) return;
    const html = value || '';
    if (editorRef.current.innerHTML !== html) {
      editorRef.current.innerHTML = html;
    }
  };

  useEffect(() => {
    syncFromValue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const makeBold = () => {
    if (!editorRef.current) return;
    document.execCommand('bold');
    // After formatting, propagate HTML up
    const html = editorRef.current.innerHTML;
    onChange(html);
    editorRef.current.focus();
  };

  const handleKeyDown = (e) => {
    const isCtrlOrMeta = e.ctrlKey || e.metaKey;
    if (isCtrlOrMeta && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      document.execCommand('bold');
      const html = editorRef.current?.innerHTML || '';
      onChange(html);
    }
  };

  return (
    <div>
      {/* Toolbar with Bold button */}
      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          onClick={makeBold}
          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 transition-colors flex items-center justify-center min-w-[40px]"
          title="Make selected text bold (Ctrl+B)"
          onMouseDown={(e) => e.preventDefault()}
        >
          <span className="font-bold">B</span>
        </button>
        <span className="text-xs text-gray-500">Select text and click B to make it bold</span>
      </div>

      {/* ContentEditable Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={() => onChange(editorRef.current?.innerHTML || '')}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all min-h-[200px] outline-none"
        style={{ minHeight }}
      />
    </div>
  );
};

export default RichTextEditor;

