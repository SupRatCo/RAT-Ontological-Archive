import { useEffect, useRef, useState } from "react";
import DocumentToolbar from "./DocumentToolbar";

export default function DocumentEditor({ document, onSave, onPublish }) {
  const editorRef = useRef(null);
  const [status, setStatus] = useState("Guardado");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = document?.content_html || "";
    setDirty(false);
    setStatus("Guardado");
  }, [document?.id]);

  useEffect(() => {
    if (!dirty) return undefined;
    const id = window.setInterval(() => {
      save();
    }, 60000);
    return () => window.clearInterval(id);
  }, [dirty]);

  function command(name, value = null) {
    window.document.execCommand?.(name, false, value);
    setDirty(true);
    setStatus("Cambios sin guardar");
  }

  async function save() {
    if (!document) return;
    setStatus("Guardando...");
    await onSave({ content_html: editorRef.current?.innerHTML || "" });
    setDirty(false);
    setStatus("Guardado");
  }

  return (
    <div className="docs-editor">
      <DocumentToolbar onCommand={command} onSave={save} onPublish={() => onPublish?.(editorRef.current?.innerHTML || "")} status={status} />
      <div
        className="docs-page"
        contentEditable
        suppressContentEditableWarning
        ref={editorRef}
        onInput={() => { setDirty(true); setStatus("Cambios sin guardar"); }}
      />
    </div>
  );
}
