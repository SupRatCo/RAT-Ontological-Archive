import { useEffect, useState } from "react";
import { forumApi } from "../../api/forum.api";
import Tabs from "../ui/Tabs";
import Input from "../ui/Input";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";
import ForumPostCard from "./ForumPostCard";
import ForumComposer from "./ForumComposer";
import useDebounce from "../../hooks/useDebounce";

const tabs = [
  { value: "recent", label: "Recent" },
  { value: "popular", label: "Popular" },
  { value: "saved", label: "Saved" },
  { value: "mine", label: "My Posts" }
];

export default function ForumFeed({ toast }) {
  const [filter, setFilter] = useState("recent");
  const [q, setQ] = useState("");
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState({ offset: 0, hasMore: false });
  const [composerOpen, setComposerOpen] = useState(false);
  const debouncedQ = useDebounce(q, 350);

  async function load(offset = 0, append = false) {
    const data = await forumApi.posts({ filter, q: debouncedQ, offset, limit: 20 });
    setPosts((current) => append ? [...current, ...data.posts] : data.posts);
    setPage(data.page);
  }

  useEffect(() => {
    load().catch((error) => toast(error.message));
  }, [filter, debouncedQ]);

  async function createPost(payload) {
    const data = await forumApi.createPost(payload);
    setPosts((current) => [data.post, ...current]);
    setComposerOpen(false);
    toast("Publicado correctamente.");
  }

  async function like(post) {
    const previous = posts;
    setPosts((current) => current.map((item) => item.id === post.id ? { ...item, liked_by_current_user: !item.liked_by_current_user, likes_count: Number(item.likes_count || 0) + (item.liked_by_current_user ? -1 : 1) } : item));
    try {
      await forumApi.like(post.id);
    } catch (error) {
      setPosts(previous);
      toast(error.message);
    }
  }

  async function save(post) {
    try {
      const data = post.saved_by_current_user ? await forumApi.unsave(post.id) : await forumApi.save(post.id);
      setPosts((current) => current.map((item) => item.id === post.id ? { ...item, saved_by_current_user: data.saved } : item));
    } catch (error) {
      toast(error.message);
    }
  }

  return (
    <section className="roa-panel">
      <header className="forum-header">
        <div className="forum-kicker">ROA FORUM</div>
        <h1 className="forum-title">COMMUNITY</h1>
      </header>
      <div className="forum-toolbar">
        <Tabs tabs={tabs} value={filter} onChange={setFilter} />
        <Input placeholder="Buscar" value={q} onChange={(event) => setQ(event.target.value)} />
        <Button variant="primary" onClick={() => setComposerOpen(true)}>+ Nuevo post</Button>
      </div>
      <div className="forum-feed">
        {posts.length ? posts.map((post) => <ForumPostCard key={post.id} post={post} onLike={like} onSave={save} onOpen={() => {}} onComment={() => {}} />) : (
          <EmptyState title="NO POSTS" kicker="/YET/" message="BE THE FIRST TO POST SOMETHING" actionLabel="Crear primer post" onAction={() => setComposerOpen(true)} />
        )}
      </div>
      {page.hasMore && <Button onClick={() => load(page.nextOffset, true)}>Cargar más</Button>}
      {composerOpen && <ForumComposer onClose={() => setComposerOpen(false)} onPublish={createPost} />}
    </section>
  );
}
