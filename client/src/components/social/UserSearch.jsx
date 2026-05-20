import { useState } from "react";
import { usersApi } from "../../api/users.api";
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function UserSearch() {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState([]);

  async function search() {
    const data = await usersApi.search(q);
    setUsers(data.users || []);
  }

  return (
    <div className="settings-section">
      <Input placeholder="Buscar usuarios" value={q} onChange={(event) => setQ(event.target.value)} />
      <Button onClick={search}>Buscar</Button>
      {users.map((user) => <p key={user.id}>{user.display_name || user.username}</p>)}
    </div>
  );
}
