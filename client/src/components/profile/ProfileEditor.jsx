import { useState } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";

export default function ProfileEditor({ user, onSave }) {
  const [form, setForm] = useState({ display_name: user?.profile?.display_name || "", bio: user?.profile?.bio || "" });
  return (
    <form className="settings-section" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
      <Input value={form.display_name} onChange={(event) => setForm({ ...form, display_name: event.target.value })} placeholder="Display name" />
      <Textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} placeholder="Bio" />
      <Button variant="primary">Guardar perfil</Button>
    </form>
  );
}
