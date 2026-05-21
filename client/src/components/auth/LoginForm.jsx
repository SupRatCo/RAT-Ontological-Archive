import { useState } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";

export default function LoginForm({ onSubmit, loading }) {
  const [form, setForm] = useState({ email: "", password: "" });

  return (
    <form className="auth-form" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
      <Input type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
      <Input type="password" placeholder="Contraseña" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
      <Button variant="primary" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</Button>
    </form>
  );
}
