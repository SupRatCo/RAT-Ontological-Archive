import { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import Select from "../ui/Select";

export default function ProjectCreateModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: "", description: "", visibility: "private" });

  return (
    <Modal title="Crear proyecto" onClose={onClose}>
      <form className="settings-section" onSubmit={(event) => { event.preventDefault(); onCreate(form); }}>
        <Input placeholder="Nombre" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <Textarea placeholder="Descripción opcional" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        <Select value={form.visibility} onChange={(event) => setForm({ ...form, visibility: event.target.value })}>
          <option value="private">Privado</option>
          <option value="public">Público</option>
        </Select>
        <Button variant="primary">Crear</Button>
      </form>
    </Modal>
  );
}
