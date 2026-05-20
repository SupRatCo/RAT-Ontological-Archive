import { useState } from "react";
import Button from "../ui/Button";
import Textarea from "../ui/Textarea";

export default function CommentBox({ onSubmit, placeholder = "Escribe un comentario..." }) {
  const [content, setContent] = useState("");
  return (
    <form onSubmit={(event) => { event.preventDefault(); onSubmit(content); setContent(""); }}>
      <Textarea placeholder={placeholder} value={content} onChange={(event) => setContent(event.target.value)} />
      <Button variant="primary">Enviar</Button>
    </form>
  );
}
