const iconMap = {
  add: "add-circle-half-dot-stroke-rounded.png",
  archive: "archive-stroke-rounded.png",
  audio: "wav-01-stroke-rounded.png",
  back: "circle-arrow-down-03-stroke-rounded.png",
  bell: "bell-dot-stroke-rounded.png",
  bookmark: "bookmark-check-02-stroke-rounded.png",
  chat: "bubble-chat-stroke-rounded.png",
  close: "cancel-circle-half-dot-stroke-rounded.png",
  colors: "colors-stroke-rounded.png",
  data: "file-management-stroke-rounded.png",
  delete: "delete-04-stroke-rounded.png",
  document: "content-writing-stroke-rounded.png",
  edit: "edit-02-stroke-rounded.png",
  forum: "bubble-chat-notification-stroke-rounded.png",
  gallery: "image-02-stroke-rounded.png",
  imageAdd: "image-add-02-stroke-rounded.png",
  like: "thumbs-up-stroke-rounded.png",
  link: "link-forward-stroke-rounded.png",
  lock: "lock-key-stroke-rounded.png",
  logout: "logout-02-stroke-rounded.png",
  menu: "menu-05-stroke-rounded.png",
  notification: "notification-01-stroke-rounded.png",
  project: "folder-02-stroke-rounded.png",
  refresh: "refresh-03-stroke-rounded.png",
  save: "floppy-disk-stroke-rounded.png",
  search: "search-02-stroke-rounded.png",
  security: "security-check-stroke-rounded.png",
  settings: "configuration-01-stroke-rounded.png",
  social: "user-multiple-02-stroke-rounded.png",
  tag: "label-important-stroke-rounded.png",
  trash: "delete-put-back-stroke-rounded.png",
  upload: "upload-06-stroke-rounded.png",
  user: "user-check-01-stroke-rounded.png",
  video: "background-stroke-rounded.png"
};

export function getIconUrl(name) {
  const fileName = iconMap[name] || iconMap.archive;
  return `${import.meta.env.BASE_URL}assets/Icons/${fileName}`;
}

export default function AppIcon({ name, label = "", size = 22, className = "" }) {
  return (
    <img
      className={`app-icon ${className}`.trim()}
      src={getIconUrl(name)}
      alt={label}
      aria-hidden={label ? undefined : "true"}
      style={{ width: size, height: size }}
    />
  );
}
