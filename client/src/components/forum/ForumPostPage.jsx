import Panel from "../ui/Panel";

export default function ForumPostPage({ post }) {
  return (
    <Panel title={post?.title || "Post"}>
      <div dangerouslySetInnerHTML={{ __html: post?.content_html || "" }} />
    </Panel>
  );
}
