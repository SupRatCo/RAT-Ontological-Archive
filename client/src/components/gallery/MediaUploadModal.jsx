import { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";

export default function MediaUploadModal({ onClose, onUpload }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");

  return (
    <Modal title="Subir media" onClose={onClose}>
      <form className="settings-section" onSubmit={(event) => { event.preventDefault(); if (file) onUpload(file, { title }); }}>
        <Input placeholder="Título" value={title} onChange={(event) => setTitle(event.target.value)} />
        <Input type="file" accept="image/*,video/*" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        <Button variant="primary">Subir</Button>
      </form>
    </Modal>
  );
}
