(function () {
  const { UI } = window.ROA;
  const recentKey = "roa_recent_emojis";
  let recognition = null;

  function editor() {
    return document.querySelector("#fileContent");
  }

  function focusEditor() {
    const node = editor();
    if (node) node.focus();
    return node;
  }

  function insertHtml(html) {
    const node = focusEditor();
    if (!node) return;
    document.execCommand("insertHTML", false, html);
    node.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function command(name, value) {
    focusEditor();
    document.execCommand(name, false, value || null);
    const node = editor();
    if (node) node.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function toolbar() {
    return `
      <div class="docs-topline">
        <span id="saveStatus">Guardado</span>
        <button class="ghost-action" type="button" data-action="manual-save-current-file">Guardar</button>
        <button class="action" type="button" data-action="publish-current-file">Publicar</button>
      </div>
      <div class="docs-toolbar">
        <button type="button" data-action="docs-command" data-command="undo" title="Deshacer">↶</button>
        <button type="button" data-action="docs-command" data-command="redo" title="Rehacer">↷</button>
        <button type="button" data-action="docs-command" data-command="bold" title="Negrita">B</button>
        <button type="button" data-action="docs-command" data-command="italic" title="Cursiva"><i>I</i></button>
        <button type="button" data-action="docs-command" data-command="underline" title="Subrayado"><u>U</u></button>
        <button type="button" data-action="docs-command" data-command="strikeThrough" title="Tachado"><s>S</s></button>
        <select class="toolbar-select" data-action="docs-block">
          <option value="P">Parrafo</option>
          <option value="H1">Titulo</option>
          <option value="H2">Subtitulo</option>
          <option value="BLOCKQUOTE">Cita</option>
        </select>
        <button type="button" data-action="docs-command" data-command="insertUnorderedList" title="Lista">• Lista</button>
        <button type="button" data-action="docs-command" data-command="insertOrderedList" title="Lista numerada">1. Lista</button>
        <button type="button" data-action="docs-command" data-command="justifyLeft" title="Izquierda">⟸</button>
        <button type="button" data-action="docs-command" data-command="justifyCenter" title="Centro">≡</button>
        <button type="button" data-action="docs-command" data-command="justifyRight" title="Derecha">⟹</button>
        <select class="toolbar-select" data-action="editor-font">
          ${["Arial", "Georgia", "Times New Roman", "Verdana", "Courier New", "Monospace", "Serif"].map((font) => `<option value="${font}">${font}</option>`).join("")}
        </select>
        <select class="toolbar-select" data-action="editor-size">
          <option value="3">Normal</option>
          <option value="2">Pequeno</option>
          <option value="4">Grande</option>
          <option value="6">Titulo</option>
        </select>
        <input class="color-compact" type="color" data-action="docs-color" title="Color" value="#f5f5f5">
        <input class="color-compact" type="color" data-action="docs-highlight" title="Resaltado" value="#ffd800">
        <button type="button" data-action="docs-hr">Separador</button>
        <button type="button" data-action="insert-internal-link">Vinculo interno</button>
        <button type="button" data-action="insert-normal-link">Link</button>
        <button type="button" data-action="insert-gallery-image">Imagen</button>
        <button type="button" data-action="open-emoji-panel">Emoji</button>
        <button type="button" data-action="toggle-keyboard">Teclado</button>
        <button type="button" data-action="toggle-speech">Voz</button>
        <button type="button" data-action="toggle-focus-mode">Foco</button>
        <button type="button" data-action="clear-text">Borrar</button>
      </div>
      <div id="emojiPanel" class="floating-panel emoji-panel hidden"></div>
      <div id="virtualKeyboard" class="virtual-keyboard hidden"></div>
      <div id="speechStatus" class="pill-mini hidden">Escuchando...</div>
    `;
  }

  function markdownToHtml(text, project) {
    const raw = String(text || "");
    if (/<(p|h1|h2|strong|em|u|blockquote|ul|ol|img|a|div|span|br|hr)\b/i.test(raw)) return raw;
    const lines = UI.escape(raw).split("\n");
    let html = lines.map((line) => {
      if (/^# /.test(line)) return `<h1>${line.replace(/^# /, "")}</h1>`;
      if (/^## /.test(line)) return `<h2>${line.replace(/^## /, "")}</h2>`;
      if (/^&gt; /.test(line)) return `<blockquote>${line.replace(/^&gt; /, "")}</blockquote>`;
      if (/^- /.test(line)) return `<ul><li>${line.replace(/^- /, "")}</li></ul>`;
      if (/^---+$/.test(line.trim())) return `<hr>`;
      return `<p>${line || "<br>"}</p>`;
    }).join("");
    html = html
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/__([^_]+)__/g, "<u>$1</u>")
      .replace(/~~([^~]+)~~/g, "<s>$1</s>")
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img class="embedded-media" alt="$1" src="$2">')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
    return html.replace(/\[\[([^\]]+)\]\]/g, (_match, name) => {
      const found = project && project.files ? project.files.find((file) => file.title.toLowerCase() === name.trim().toLowerCase()) : null;
      return found ? `<a class="wiki-link" href="#" data-action="open-file" data-file-id="${found.id}">${UI.escape(name.trim())}</a>` : `<span class="wiki-link missing">${UI.escape(name.trim())}</span>`;
    });
  }

  function applyFormat(format) {
    const map = {
      bold: "bold",
      italic: "italic",
      underline: "underline",
      strike: "strikeThrough",
      h1: "formatBlock:H1",
      h2: "formatBlock:H2",
      list: "insertUnorderedList",
      quote: "formatBlock:BLOCKQUOTE",
      hr: "insertHorizontalRule"
    };
    const next = map[format];
    if (!next) return;
    if (next.includes(":")) {
      const [cmd, value] = next.split(":");
      command(cmd, value);
    } else command(next);
  }

  function applyFont(font) { command("fontName", font); }
  function applySize(size) { command("fontSize", size); }
  function applyColor(color) { command("foreColor", color); }
  function applyHighlight(color) { command("hiliteColor", color); }
  function applyBlock(block) { command("formatBlock", block); }
  function insertHr() { command("insertHorizontalRule"); }

  function insertInternalLink() {
    const project = UI.currentProject();
    if (!project || !project.files.length) return UI.toast("No hay archivos para vincular.");
    UI.openModal("Insertar vinculo interno", `
      <section class="item-list">
        ${project.files.filter((file) => !file.archived).map((file) => `
          <button class="list-row" type="button" data-action="choose-internal-link" data-file-id="${file.id}">
            <strong>${UI.escape(file.title)}</strong><span class="meta">${UI.fileTypeLabel(file.type)}</span>
          </button>
        `).join("")}
      </section>
    `, { size: "small" });
  }

  function chooseInternalLink(fileId) {
    const project = UI.currentProject();
    const file = project && project.files.find((item) => item.id === fileId);
    UI.closeModal();
    if (file) insertHtml(`<a class="wiki-link" href="#" data-action="open-file" data-file-id="${file.id}">${UI.escape(file.title)}</a>&nbsp;`);
  }

  async function insertNormalLink() {
    const result = await UI.promptFields("Insertar enlace", [
      { name: "label", label: "Texto", required: true },
      { name: "url", label: "URL", required: true }
    ], "Insertar");
    if (result.label && result.url) insertHtml(`<a href="${UI.escape(result.url)}" target="_blank" rel="noreferrer">${UI.escape(result.label)}</a>&nbsp;`);
  }

  function insertGalleryImage() {
    const project = UI.currentProject();
    const images = (project.gallery || []).filter((item) => item.kind !== "video");
    if (!images.length) return UI.toast("No hay imagenes en la galeria.");
    UI.openModal("Insertar imagen", `<div class="gallery-grid">${images.map((image) => `
      <button class="archive-card gallery-card" type="button" data-action="choose-editor-image" data-image-id="${image.id}">
        <img src="${UI.escape(image.src)}" alt="${UI.escape(image.name)}"><strong>${UI.escape(image.name)}</strong>
      </button>`).join("")}</div>`);
  }

  function chooseImage(imageId) {
    const project = UI.currentProject();
    const image = project.gallery.find((item) => item.id === imageId);
    UI.closeModal();
    if (image) insertHtml(`<img class="embedded-media" src="${UI.escape(image.src)}" alt="${UI.escape(image.name)}">`);
  }

  function togglePreview() {}

  function emojiGroups() {
    const recent = JSON.parse(localStorage.getItem(recentKey) || "[]");
    return {
      "Recientes": recent,
      "Caras": ["😀", "😁", "😂", "😊", "😍", "😎", "😢", "😡", "🤔", "😴"],
      "Simbolos": ["★", "✦", "∞", "⚠", "✓", "✕", "→", "←", "◆"],
      "Objetos": ["📚", "🛡", "🔮", "🧭", "📜", "🧪", "💎", "🕯", "🔑"],
      "Naturaleza": ["🌙", "☀", "⭐", "🌌", "🔥", "🌊", "🌲", "🌹", "⚡"],
      "Fantasia/Sci-fi": ["👁", "🛸", "🚀", "🪐", "👑", "🧙", "🧬", "🤖", "🌀"]
    };
  }

  function openEmojiPanel() {
    const panel = document.querySelector("#emojiPanel");
    if (!panel) return;
    panel.innerHTML = Object.entries(emojiGroups()).map(([name, items]) => `
      <section><strong>${name}</strong><div class="emoji-grid">${(items.length ? items : ["-"]).map((emoji) => `<button type="button" data-action="insert-emoji" data-emoji="${emoji}">${emoji}</button>`).join("")}</div></section>
    `).join("");
    panel.classList.toggle("hidden");
  }

  function insertEmoji(emoji) {
    if (!emoji || emoji === "-") return;
    insertHtml(UI.escape(emoji));
    const recent = JSON.parse(localStorage.getItem(recentKey) || "[]").filter((item) => item !== emoji);
    recent.unshift(emoji);
    localStorage.setItem(recentKey, JSON.stringify(recent.slice(0, 16)));
    const panel = document.querySelector("#emojiPanel");
    if (panel) panel.classList.add("hidden");
  }

  async function clearText() {
    const ok = await UI.confirm("Borrar documento", "Seguro que quieres borrar todo el contenido?", "Borrar", true);
    if (!ok) return;
    const node = editor();
    node.innerHTML = "";
    node.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function toggleKeyboard() {
    const keyboard = document.querySelector("#virtualKeyboard");
    if (!keyboard) return;
    const rows = ["1234567890", "qwertyuiop", "asdfghjklñ", "zxcvbnm,.?"].map((row) => `<div>${row.split("").map((key) => `<button type="button" data-action="keyboard-key" data-key="${key}">${key}</button>`).join("")}</div>`).join("");
    keyboard.innerHTML = `${rows}<div><button data-action="keyboard-key" data-key=" ">Espacio</button><button data-action="keyboard-key" data-key="<br>">Enter</button><button data-action="keyboard-backspace">Borrar</button><button data-action="insert-emoji" data-emoji="✨">✨</button></div>`;
    keyboard.classList.toggle("hidden");
  }

  function keyboardKey(key) { insertHtml(key); }
  function keyboardBackspace() { command("delete"); }

  function toggleSpeech() {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) return UI.toast("Voz a texto no esta disponible en este navegador.");
    const status = document.querySelector("#speechStatus");
    if (recognition) {
      recognition.stop();
      recognition = null;
      if (status) status.classList.add("hidden");
      return;
    }
    recognition = new Speech();
    recognition.lang = (window.ROA.App.data.settings.language || "es-latam").startsWith("en") ? "en-US" : "es-ES";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const text = Array.from(event.results).slice(event.resultIndex).map((result) => result[0].transcript).join(" ");
      insertHtml(`${UI.escape(text)} `);
    };
    recognition.onend = () => {
      recognition = null;
      if (status) status.classList.add("hidden");
    };
    if (status) status.classList.remove("hidden");
    recognition.start();
  }

  function toggleFocusMode() {
    document.body.classList.toggle("docs-focus-mode");
  }

  window.ROA = window.ROA || {};
  window.ROA.Editor = {
    toolbar,
    markdownToHtml,
    applyFormat,
    applyFont,
    applySize,
    applyColor,
    applyHighlight,
    applyBlock,
    insertHr,
    insertInternalLink,
    chooseInternalLink,
    insertNormalLink,
    insertGalleryImage,
    chooseImage,
    togglePreview,
    openEmojiPanel,
    insertEmoji,
    clearText,
    toggleKeyboard,
    keyboardKey,
    keyboardBackspace,
    toggleSpeech,
    toggleFocusMode,
    command
  };
})();
