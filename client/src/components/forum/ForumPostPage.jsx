import { useEffect, useState } from "react";
import { createComment, getComments } from "../../services/forumService";
import { formatDate } from "../../utils/formatDate";
import AppIcon from "../ui/AppIcon";
import Button from "../ui/Button";
import Panel from "../ui/Panel";
import CommentBox from "./CommentBox";
import CommentThread from "./CommentThread";

export default function ForumPostPage({ post, onBack, onLike, onSave, toast }) {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (!post?.id) return;
    getComments(post.id).then((data) => setComments(data.comments || [])).catch((error) => toast?.(error.message));
  }, [post?.id, toast]);

  async function submitComment(content) {
    try {
      const data = await createComment(post.id, { content });
      setComments((current) => [...current, data.comment]);
      toast?.("Comentario publicado.");
    } catch (error) {
      toast?.(error.message || "No se pudo comentar.");
    }
  }

  return (
    <Panel className="forum-detail">
      <Button onClick={onBack}>Volver</Button>
      <div className="forum-post-top">
        <div className="roa-avatar" style={{ width: 40, height: 40, borderWidth: 2 }}>
          {post.avatar_url ? <img src={post.avatar_url} alt="" /> : (post.display_name || post.username || "U").slice(0, 1).toUpperCase()}
        </div>
        <span>{post.display_name || post.username}</span>
        <span className="forum-post-date">{formatDate(post.created_at)}</span>
      </div>
      <p className="forum-kicker">{post.type === "project" ? "PROYECTO PUBLICADO" : "COMUNIDAD"}</p>
      <h1 className="forum-post-title">{post.title}</h1>
      {post.cover_url && <img className="forum-detail-cover" src={post.cover_url} alt="" />}
      {post.summary && <strong>{post.summary}</strong>}
      <div className="forum-detail-content" dangerouslySetInnerHTML={{ __html: post.content_html || "" }} />
      <div className="forum-post-actions">
        <Button onClick={() => onSave(post)}><AppIcon name="bookmark" size={18} />{post.saved_by_current_user ? "Guardado" : "Guardar"}</Button>
        <Button onClick={() => onLike(post)}><AppIcon name="like" size={18} />{post.likes_count || 0}</Button>
      </div>
      <section className="forum-comments">
        <h2 className="roa-panel-title">Comentarios</h2>
        <CommentBox onSubmit={submitComment} />
        <CommentThread comments={comments} />
      </section>
    </Panel>
  );
}
