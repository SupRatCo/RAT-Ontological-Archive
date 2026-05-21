import { useEffect, useRef, useState } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import DocumentToolbar from "./DocumentToolbar";

export default function DocumentEditor({ document, onBack, onSave, onDelete, onPublish }) {
  const editorRef = useRef(null);
  const [title, setTitle] = useState(document?.title || "");
  const [status, setStatus] = useState("Guardado");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setTitle(document?.title || "");
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
  }, [dirty, title]);

  function command(name, value = null) {
    window.document.execCommand?.(name, false, value);
    setDirty(true);
    setStatus("Cambios sin guardar");
  }

  async function save() {
    if (!document) return;
    setStatus("Guardando...");
    await onSave({ title, content_html: editorRef.current?.innerHTML || "" });
    setDirty(false);
    setStatus("Guardado");
  }

  return (
    <div className="docs-editor">
      <div className="docs-editor-header">
        <Button onClick={onBack}>Volver</Button>
        <Input value={title} onChange={(event) => { setTitle(event.target.value); setDirty(true); setStatus("Cambios sin guardar"); }} />
        <Button variant="danger" onClick={onDelete}>Eliminar</Button>
      </div>
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
