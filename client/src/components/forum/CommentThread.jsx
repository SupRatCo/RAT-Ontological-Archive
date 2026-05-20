export default function CommentThread({ comments = [] }) {
  const roots = comments.filter((comment) => !comment.parent_comment_id);
  const replies = comments.filter((comment) => comment.parent_comment_id);

  return (
    <div className="comment-thread">
      {roots.map((comment) => (
        <div className="comment-card" key={comment.id}>
          <strong>{comment.display_name || comment.username}</strong>
          <p>{comment.content}</p>
          {replies.filter((reply) => reply.parent_comment_id === comment.id).map((reply) => (
            <div className="comment-card" key={reply.id} style={{ marginLeft: 24 }}>
              <strong>{reply.display_name || reply.username}</strong>
              <p>{reply.content}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
