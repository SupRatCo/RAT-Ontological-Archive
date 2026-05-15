(function () {
  const { UI, Storage } = window.ROA;
  let lastFilters = {};
  const PAGE_SIZE = 18;
  let feedCache = [];
  let nextOffset = 0;
  let hasMorePosts = false;
  let loadingFeed = false;

  function safeHtml(html) {
    const template = document.createElement("template");
    template.innerHTML = String(html || "");
    template.content.querySelectorAll("script, iframe, object, embed").forEach((node) => node.remove());
    template.content.querySelectorAll("*").forEach((node) => {
      [...node.attributes].forEach((attr) => {
        if (/^on/i.test(attr.name)) node.removeAttribute(attr.name);
        if ((attr.name === "href" || attr.name === "src") && /^javascript:/i.test(attr.value)) node.removeAttribute(attr.name);
      });
    });
    return template.innerHTML;
  }

  function localPosts() {
    const app = window.ROA.App;
    app.data.forumPosts = app.data.forumPosts || [];
    return app.data.forumPosts;
  }

  function avatar(author) {
    const name = (author && author.username) || "Autor";
    const raw = author && (author.avatar_url || author.avatar);
    const src = window.ROA.Api && window.ROA.Api.assetUrl ? window.ROA.Api.assetUrl(raw) : raw;
    return `<span class="forum-avatar" style="${src ? `background-image:url('${UI.escape(src)}')` : ""}">${src ? "" : UI.escape(name[0] || "A")}</span>`;
  }

  async function getPosts(filters, append) {
    if (window.ROA.Api.serverMode) {
      try {
        const params = Object.assign({}, filters || {}, { limit: PAGE_SIZE, offset: append ? nextOffset : 0 });
        const data = await window.ROA.Api.getForumPosts(params);
        hasMorePosts = !!(data.page && data.page.hasMore);
        nextOffset = data.page ? data.page.nextOffset : (append ? nextOffset + (data.posts || []).length : (data.posts || []).length);
        if (append) feedCache = feedCache.concat(data.posts || []);
        else feedCache = data.posts || [];
        return feedCache;
      } catch (error) {
        UI.toast(error.message || "No se pudo cargar el foro.");
        return [];
      }
    }
    const q = String(filters && filters.q || "").toLowerCase();
    feedCache = localPosts().filter((post) => !q || `${post.title} ${post.content} ${post.summary} ${(post.tags || []).join(" ")}`.toLowerCase().includes(q));
    hasMorePosts = false;
    return feedCache;
  }

  async function renderFeed(filters, append) {
    if (loadingFeed) return;
    loadingFeed = true;
    lastFilters = Object.assign({}, filters || {});
    const user = window.ROA.Auth.currentUser();
    const previousLength = append ? feedCache.length : 0;
    const posts = await getPosts(lastFilters, append);
    loadingFeed = false;
    if (append) {
      appendPosts(posts.slice(previousLength), user);
      updateLoadMore();
      return;
    }
    document.querySelector("#mainView").innerHTML = `
      <section class="forum-shell">
        <header class="forum-hero compact-hero">
          <div>
            <span class="overline">R.O.A. FORUM</span>
            <h1>Comunidad</h1>
          </div>
          <button class="action" type="button" data-action="create-forum-post">+ Nuevo post</button>
        </header>
        <section class="forum-filters">
          ${[
            ["recent", "Recientes"],
            ["popular", "Populares"],
            ["commented", "Comentadas"],
            ["saved", "Guardadas"],
            ["mine", "Mias"]
          ].map(([key, label]) => `<button class="ghost-action ${lastFilters.filter === key ? "active" : ""}" data-action="open-forum" data-filter="${key}">${label}</button>`).join("")}
          <input id="forumSearch" placeholder="Buscar" value="${UI.escape(lastFilters.q || "")}">
        </section>
        <section class="forum-feed">
          ${posts.map((post) => renderPostCard(post, user)).join("") || `<article class="empty-state"><div><h2>Sin publicaciones</h2><p>Crea un post o publica un documento.</p></div></article>`}
        </section>
        <div class="forum-load-more">${hasMorePosts ? `<button class="ghost-action" type="button" data-action="load-more-forum">Cargar mas</button>` : ""}</div>
      </section>
    `;
    const search = document.querySelector("#forumSearch");
    if (search) search.addEventListener("input", debounce(() => renderFeed(Object.assign({}, lastFilters, { q: search.value })), 320));
  }

  function appendPosts(posts, user) {
    const feed = document.querySelector(".forum-feed");
    if (!feed || !posts.length) return;
    const html = posts.map((post) => renderPostCard(post, user)).join("");
    feed.insertAdjacentHTML("beforeend", html);
  }

  function updateLoadMore() {
    const node = document.querySelector(".forum-load-more");
    if (node) node.innerHTML = hasMorePosts ? `<button class="ghost-action" type="button" data-action="load-more-forum">Cargar mas</button>` : "";
  }

  function debounce(fn, ms) {
    let id;
    return () => {
      clearTimeout(id);
      id = setTimeout(fn, ms);
    };
  }

  function renderPostCard(post) {
    const author = post.author || { id: post.userId, username: post.authorName || "Autor", avatar_url: post.authorAvatar || "" };
    return `
      <article class="forum-card" data-context-type="post" data-post-id="${post.id}" data-user-id="${author.id}">
        <button class="forum-author" data-action="open-public-profile" data-user-id="${author.id}" type="button">
          ${avatar(author)}
          <span>${UI.escape(author.username || "Autor")}</span>
        </button>
        <button class="forum-title-button" data-action="open-forum-post" data-post-id="${post.id}" type="button">
          <strong>${UI.escape(post.title)}</strong>
          <span>${UI.escape(post.summary || stripHtml(post.content).slice(0, 180))}</span>
        </button>
        <div class="tag-list">${(post.tags || []).map((tag) => `<span class="pill-mini">${UI.escape(tag)}</span>`).join("")}</div>
        <footer class="forum-card-footer">
          <span>${UI.formatDate(post.createdAt)}</span>
          <button class="${post.liked ? "liked" : ""}" data-action="vote-forum" data-target-type="post" data-target-id="${post.id}" data-vote-type="up" type="button">Like ${post.upvotes || 0}</button>
          <button data-action="open-forum-post" data-post-id="${post.id}" type="button">${post.commentsCount || 0} comentarios</button>
          <button data-action="save-forum-post" data-post-id="${post.id}" type="button">${post.saved ? "Guardado" : "Guardar"}</button>
        </footer>
      </article>
    `;
  }

  function stripHtml(html) {
    const temp = document.createElement("div");
    temp.innerHTML = html || "";
    return temp.textContent || "";
  }

  function openPostComposer(fileId) {
    const project = UI.currentProject();
    const file = fileId && project ? project.files.find((item) => item.id === fileId) : null;
    const publicProjects = window.ROA.App.data.projects.filter((item) => item.visibility === "public" && window.ROA.Permissions.canEdit(item));
    UI.openModal(file ? "Publicar documento" : "Nuevo post", `
      <form id="forumPostForm" class="form-grid one">
        <input type="hidden" name="sourceFileId" value="${file ? file.id : ""}">
        <label class="field">Titulo<input name="title" required value="${UI.escape(file ? file.title : "")}"></label>
        <label class="field">Resumen<textarea name="summary">${UI.escape(file ? stripHtml(file.content).slice(0, 220) : "")}</textarea></label>
        <label class="field">Contenido
          <div id="forumPostContent" class="docs-editor forum-composer" contenteditable="true">${file ? safeHtml(file.content) : ""}</div>
        </label>
        <label class="field">Etiquetas<input name="tags" placeholder="fantasia, capitulo, lore"></label>
        <label class="field">Proyecto publico vinculado
          <select name="projectId"><option value="">Sin proyecto</option>${publicProjects.map((item) => `<option value="${item.id}" ${project && project.id === item.id ? "selected" : ""}>${UI.escape(item.name)}</option>`).join("")}</select>
        </label>
        <label class="field">Visibilidad<select name="visibility"><option value="public">Publica</option><option value="private">Privada</option></select></label>
        <button class="action" type="button" data-action="submit-forum-post">Publicar</button>
      </form>
    `);
  }

  async function submitPost() {
    const form = document.querySelector("#forumPostForm");
    const contentNode = document.querySelector("#forumPostContent");
    const values = Object.fromEntries(new FormData(form).entries());
    const content = safeHtml(contentNode.innerHTML);
    if (!values.title.trim()) return UI.toast("El titulo no puede estar vacio.");
    if (!stripHtml(content).trim()) return UI.toast("El contenido no puede estar vacio.");
    const current = window.ROA.Auth.currentUser();
    const post = {
      id: Storage.uid("post"),
      userId: current.id,
      author: { id: current.id, username: current.username, avatar_url: current.avatar },
      title: values.title.trim(),
      content,
      contentSnapshot: content,
      sourceFileId: values.sourceFileId || null,
      summary: values.summary,
      projectId: values.projectId || null,
      visibility: values.visibility || "public",
      tags: values.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      upvotes: 0,
      comments: [],
      createdAt: Storage.now(),
      updatedAt: Storage.now()
    };
    if (window.ROA.Api.serverMode) await window.ROA.Api.createForumPost(post);
    else {
      localPosts().unshift(post);
      window.ROA.App.save();
    }
    UI.closeModal();
    UI.toast("Publicado.");
    renderFeed({});
  }

  async function openPost(postId) {
    let post;
    let comments = [];
    if (window.ROA.Api.serverMode) {
      const data = await window.ROA.Api.getForumPost(postId);
      post = data.post;
      comments = data.comments || [];
    } else {
      post = localPosts().find((item) => item.id === postId);
      comments = post.comments || [];
    }
    const author = post.author || { id: post.userId, username: post.authorName || "Autor", avatar_url: post.authorAvatar || "" };
    UI.openModal(post.title, `
      <article class="forum-full">
        <button class="forum-author" data-action="open-public-profile" data-user-id="${author.id}" type="button">${avatar(author)}<span>${UI.escape(author.username || "Autor")}</span></button>
        <div class="docs-reader">${safeHtml(post.content)}</div>
        <div class="inline-actions">
          <button class="${post.liked ? "liked" : ""}" data-action="vote-forum" data-target-type="post" data-target-id="${post.id}" data-vote-type="up">Like ${post.upvotes || 0}</button>
        </div>
      </article>
      <section class="panel comments-panel">
        <h3>Comentarios</h3>
        <div class="comment-list">${renderComments(comments)}</div>
        <label class="field">Comentar<textarea id="forumCommentText" rows="3"></textarea></label>
        <button class="action" data-action="submit-forum-comment" data-post-id="${post.id}" type="button">Enviar</button>
      </section>
    `);
  }

  function renderComments(comments) {
    const roots = comments.filter((item) => !item.parent_comment_id && !item.parentCommentId);
    const children = comments.filter((item) => item.parent_comment_id || item.parentCommentId);
    const renderOne = (comment, depth) => {
      const author = { id: comment.user_id || comment.userId, username: comment.username || "Usuario", avatar_url: comment.avatar_url || comment.avatar || "" };
      const replies = children.filter((item) => (item.parent_comment_id || item.parentCommentId) === comment.id);
      return `
        <article class="comment-card depth-${Math.min(depth, 2)}">
          <button class="forum-author compact" data-action="open-public-profile" data-user-id="${author.id}" type="button">${avatar(author)}<span>${UI.escape(author.username)}</span></button>
          <p>${UI.escape(comment.content || "")}</p>
          <div class="inline-actions">
            <button class="ghost-action" data-action="show-reply-box" data-post-id="${comment.post_id || comment.postId}" data-comment-id="${comment.id}" type="button">Responder</button>
            <button class="ghost-action" data-action="vote-forum" data-target-type="comment" data-target-id="${comment.id}" data-vote-type="up" type="button">Like</button>
          </div>
          <div id="replyBox-${comment.id}" class="reply-box hidden">
            <textarea rows="2" placeholder="Responder..."></textarea>
            <button class="action" data-action="submit-forum-reply" data-post-id="${comment.post_id || comment.postId}" data-parent-comment-id="${comment.id}" type="button">Enviar</button>
          </div>
          ${replies.map((child) => renderOne(child, depth + 1)).join("")}
        </article>
      `;
    };
    return roots.map((comment) => renderOne(comment, 0)).join("") || `<p class="meta">Sin comentarios.</p>`;
  }

  async function submitComment(postId, parentCommentId, textOverride) {
    const text = (textOverride || document.querySelector("#forumCommentText").value || "").trim();
    if (!text) return UI.toast("El comentario no puede estar vacio.");
    if (window.ROA.Api.serverMode) await window.ROA.Api.createForumComment(postId, { content: text, parentCommentId });
    else {
      const post = localPosts().find((item) => item.id === postId);
      post.comments = post.comments || [];
      post.comments.push({ id: Storage.uid("comment"), postId, parentCommentId, userId: window.ROA.Auth.currentUser().id, username: window.ROA.Auth.currentUser().username, content: text, createdAt: Storage.now() });
      window.ROA.App.save();
    }
    openPost(postId);
  }

  async function submitReply(postId, parentCommentId) {
    const box = document.querySelector(`#replyBox-${CSS.escape(parentCommentId)} textarea`);
    await submitComment(postId, parentCommentId, box ? box.value : "");
  }

  async function vote(targetType, targetId, voteType) {
    let result = { liked: true, upvotes: 0 };
    if (window.ROA.Api.serverMode) result = await window.ROA.Api.voteForumItem(targetType, targetId, voteType);
    else UI.toast("Like registrado.");
    updateVoteButtons(targetType, targetId, result);
  }

  async function savePost(postId) {
    let result = { saved: true };
    if (window.ROA.Api.serverMode) result = await window.ROA.Api.saveForumPost(postId);
    else UI.toast("Publicacion guardada.");
    document.querySelectorAll(`[data-action="save-forum-post"][data-post-id="${CSS.escape(postId)}"]`).forEach((button) => {
      button.textContent = result.saved ? "Guardado" : "Guardar";
      button.classList.toggle("active", !!result.saved);
    });
  }

  function updateVoteButtons(targetType, targetId, result) {
    const label = targetType === "post" ? `Like ${result.upvotes || 0}` : "Like";
    document.querySelectorAll(`[data-action="vote-forum"][data-target-type="${targetType}"][data-target-id="${CSS.escape(targetId)}"]`).forEach((button) => {
      button.classList.toggle("liked", !!result.liked);
      if (targetType === "post") button.textContent = label;
    });
    const cached = feedCache.find((post) => post.id === targetId);
    if (cached) {
      cached.liked = !!result.liked;
      cached.upvotes = result.upvotes || 0;
      cached.likesCount = result.upvotes || 0;
    }
  }

  async function openPublicProfile(userId) {
    if (window.ROA.Api.serverMode) {
      const data = await window.ROA.Api.getPublicUser(userId);
      const user = data.user;
      const banner = window.ROA.Api.assetUrl(user.banner || "");
      UI.openModal(user.username, `
        <section class="public-profile">
          <div class="profile-banner" style="${banner ? `background-image:url('${UI.escape(banner)}')` : ""}"></div>
          <div class="public-profile-head">${avatar(user)}<div><h3>${UI.escape(user.username)}</h3><p>${UI.escape(user.bio || "Sin bio publica.")}</p><span class="meta">Desde ${UI.formatDate(user.createdAt)}</span></div></div>
        </section>
        <section class="panel"><h3>Publicaciones</h3>${data.posts.map((post) => `<button class="list-row" data-action="open-forum-post" data-post-id="${post.id}">${UI.escape(post.title)}</button>`).join("") || "<p class='meta'>Sin publicaciones publicas.</p>"}</section>
        <section class="panel"><h3>Proyectos publicos</h3>${data.projects.map((project) => `<button class="list-row" data-action="select-project" data-project-id="${project.id}">${UI.escape(project.name)}</button>`).join("") || "<p class='meta'>Sin proyectos publicos.</p>"}</section>
      `);
      return;
    }
    UI.toast("Perfil publico disponible en modo servidor.");
  }

  function showReplyBox(commentId) {
    const box = document.querySelector(`#replyBox-${CSS.escape(commentId)}`);
    if (box) box.classList.toggle("hidden");
  }

  window.ROA = window.ROA || {};
  window.ROA.Forum = { renderFeed, openPostComposer, submitPost, openPost, submitComment, submitReply, vote, savePost, openPublicProfile, showReplyBox, safeHtml };
})();
