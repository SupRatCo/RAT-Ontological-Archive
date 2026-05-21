import AppIcon from "../ui/AppIcon";
import Button from "../ui/Button";
import Card from "../ui/Card";
import { formatDate } from "../../utils/formatDate";
import { stripHtml } from "../../utils/sanitize";

export default function ForumPostCard({ post, onLike, onSave, onOpen, onComment }) {
  const authorName = post.display_name || post.username || "Usuario";
  const avatar = post.avatar_url;

  return (
    <Card className="forum-post-card">
      <div className="forum-post-top">
        <div className="roa-avatar" style={{ width: 34, height: 34, borderWidth: 2 }}>
          {avatar ? <img src={avatar} alt="" /> : authorName.slice(0, 1).toUpperCase()}
        </div>
        <span>{authorName}</span>
      </div>
      <h2 className="forum-post-title">{post.title}</h2>
      {post.summary && <strong>{post.summary}</strong>}
      <p className="forum-post-content">{stripHtml(post.content_html || "").slice(0, 280)}</p>
      <div className="forum-post-actions">
        <Button onClick={() => onSave(post)}><AppIcon name="bookmark" size={18} />{post.saved_by_current_user ? "Saved" : "Save"}</Button>
        <Button onClick={() => onComment(post)}><AppIcon name="chat" size={18} />Comment · {post.comments_count || 0}</Button>
        <Button onClick={() => onLike(post)}><AppIcon name="like" size={18} />{post.likes_count || 0}</Button>
        <Button onClick={() => onOpen(post)}>Abrir</Button>
        <span className="forum-post-date">{formatDate(post.created_at)}</span>
      </div>
    </Card>
  );
}
