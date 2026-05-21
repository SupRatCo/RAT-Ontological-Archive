const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s", "h1", "h2", "h3",
  "ul", "ol", "li", "blockquote", "a", "img", "hr", "span", "div"
]);

const ALLOWED_ATTRS = new Set(["href", "src", "alt", "title", "class", "data-roa-link", "data-target-id", "data-target-type"]);

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeHtml(html = "") {
  let safe = String(html);
  safe = safe.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  safe = safe.replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, "");
  safe = safe.replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, "");
  safe = safe.replace(/<\/?([a-z0-9-]+)([^>]*)>/gi, (match, tagName, attrs = "") => {
    const tag = String(tagName).toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    const cleanedAttrs = [];
    attrs.replace(/\s([a-z0-9-:]+)(?:\s*=\s*(".*?"|'.*?'|[^\s"'>]+))?/gi, (_attrMatch, rawName, rawValue = "") => {
      const name = String(rawName).toLowerCase();
      if (!ALLOWED_ATTRS.has(name)) return "";
      const value = String(rawValue).replace(/^['"]|['"]$/g, "");
      if ((name === "href" || name === "src") && /^javascript:/i.test(value.trim())) return "";
      cleanedAttrs.push(`${name}="${escapeHtml(value)}"`);
      return "";
    });
    return match.startsWith("</") ? `</${tag}>` : `<${tag}${cleanedAttrs.length ? ` ${cleanedAttrs.join(" ")}` : ""}>`;
  });
  return safe;
}

function normalizeUsername(username = "") {
  return String(username).trim().replace(/\s+/g, "_").slice(0, 32);
}

module.exports = {
  escapeHtml,
  sanitizeHtml,
  normalizeUsername
};
