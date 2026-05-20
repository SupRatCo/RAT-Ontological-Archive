import { useState } from "react";
import LoginForm from "../components/auth/LoginForm";
import RegisterForm from "../components/auth/RegisterForm";
import Panel from "../components/ui/Panel";
import Button from "../components/ui/Button";
import useAuth from "../hooks/useAuth";

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  async function submit(payload) {
    setError(payload.clientError || "");
    if (payload.clientError) return;
    setLoading(true);
    try {
      if (mode === "login") await login(payload);
      else await register(payload);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="roa-app auth-page">
      <Panel className="auth-card">
        <h1>RAT Ontological Archive</h1>
        <p>Archivo narrativo online-first.</p>
        {mode === "login" ? <LoginForm onSubmit={submit} loading={loading} /> : <RegisterForm onSubmit={submit} loading={loading} />}
        {error && <p style={{ color: "var(--roa-danger)" }}>{error}</p>}
        <p className="auth-switch">
          {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
          <Button onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Crear cuenta" : "Iniciar sesión"}</Button>
        </p>
      </Panel>
    </div>
  );
}
