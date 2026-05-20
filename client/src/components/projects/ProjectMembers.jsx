export default function ProjectMembers({ members = [] }) {
  return (
    <div className="roa-panel">
      <h2 className="roa-panel-title">Colaboradores</h2>
      {members.length ? members.map((member) => <p key={member.id}>{member.username} · {member.role}</p>) : <p>Sin colaboradores todavía.</p>}
    </div>
  );
}
