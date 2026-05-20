import { useState } from "react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import Button from "../ui/Button";

export default function PublishDocumentModal({ document, content, onClose, onPublish }) {
  const [form, setForm] = useState({ title: document?.title || "", summary: "", visibility: "public" });

  return (
    <Modal title="Publicar documento" onClose={onClose}>
      <form className="settings-section" onSubmit={(event) => { event.preventDefault(); onPublish({ ...form, content_html: content, source_type: "document", source_document_id: document.id }); }}>
        <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Título público" />
        <Textarea value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} placeholder="Resumen opcional" />
        <Button variant="primary">Publicar</Button>
      </form>
    </Modal>
  );
}
