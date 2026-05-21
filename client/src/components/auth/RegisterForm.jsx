import { useState } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";

export default function RegisterForm({ onSubmit, loading }) {
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });

  function submit(event) {
    event.preventDefault();
    if (form.password !== form.confirm) return onSubmit({ ...form, clientError: "Las contraseñas no coinciden." });
    onSubmit(form);
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <Input placeholder="Username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
      <Input type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
      <Input type="password" placeholder="Contraseña" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
      <Input type="password" placeholder="Confirmar contraseña" value={form.confirm} onChange={(event) => setForm({ ...form, confirm: event.target.value })} />
      <Button variant="primary" disabled={loading}>{loading ? "Creando..." : "Crear cuenta"}</Button>
    </form>
  );
}
