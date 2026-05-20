export function canEdit(role) {
  return role === "owner" || role === "editor";
}

export function isOwner(role) {
  return role === "owner";
}
