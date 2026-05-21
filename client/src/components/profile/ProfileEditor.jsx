import { useState } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import { uploadUserAvatar, uploadUserBanner } from "../../services/userService";

export default function ProfileEditor({ user, onSave }) {
  const [form, setForm] = useState({ display_name: user?.profile?.display_name || "", bio: user?.profile?.bio || "" });
  const [uploading, setUploading] = useState("");

  async function upload(kind, file) {
    if (!file) return;
    setUploading(kind);
    try {
      const data = kind === "avatar" ? await uploadUserAvatar(file) : await uploadUserBanner(file);
      onSave({ display_name: data.user.profile.display_name, bio: data.user.profile.bio });
    } finally {
      setUploading("");
    }
  }

  return (
    <form className="settings-section" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
      <Input value={form.display_name} onChange={(event) => setForm({ ...form, display_name: event.target.value })} placeholder="Display name" />
      <Textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} placeholder="Bio" />
      <label>
        Avatar
        <Input type="file" accept="image/*" disabled={uploading === "avatar"} onChange={(event) => upload("avatar", event.target.files?.[0])} />
      </label>
      <label>
        Banner
        <Input type="file" accept="image/*" disabled={uploading === "banner"} onChange={(event) => upload("banner", event.target.files?.[0])} />
      </label>
      <Button variant="primary">Guardar perfil</Button>
    </form>
  );
}
