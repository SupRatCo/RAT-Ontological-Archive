import { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";

export default function ForumComposer({ onClose, onPublish, title = "Nuevo post", initial = {}, submitLabel = "Publicar" }) {
  const [form, setForm] = useState({ title: "", summary: "", content_html: "", visibility: "public", ...initial });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onPublish(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form className="settings-section" onSubmit={submit}>
        <Input placeholder="Título" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        <Input placeholder="Resumen opcional" value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} />
        <Textarea placeholder="Contenido" value={form.content_html} onChange={(event) => setForm({ ...form, content_html: event.target.value })} />
        {error && <p style={{ color: "var(--roa-danger)" }}>{error}</p>}
        <Button variant="primary" disabled={loading}>{loading ? "Publicando..." : submitLabel}</Button>
      </form>
    </Modal>
  );
}
