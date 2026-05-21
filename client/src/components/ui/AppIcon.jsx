const iconMap = {
  add: "dashboard-square-add-stroke-rounded.png",
  archive: "libraries-stroke-rounded.png",
  audio: "file-headphone-stroke-rounded.png",
  back: "door-open-stroke-rounded.png",
  bell: "notification-01-stroke-rounded.png",
  bookmark: "bookmark-check-02-stroke-rounded.png",
  chat: "bubble-chat-stroke-rounded.png",
  close: "alert-diamond-stroke-rounded.png",
  colors: "dashboard-square-edit-stroke-rounded.png",
  data: "circuit-board-stroke-rounded.png",
  delete: "dashboard-square-remove-stroke-rounded.png",
  document: "file-02-stroke-rounded.png",
  edit: "folder-edit-stroke-rounded.png",
  forum: "bubble-chat-notification-stroke-rounded.png",
  gallery: "file-image-stroke-rounded.png",
  imageAdd: "file-image-stroke-rounded.png",
  like: "thumbs-up-stroke-rounded.png",
  link: "internet-stroke-rounded.png",
  lock: "key-01-stroke-rounded.png",
  logout: "door-open-stroke-rounded.png",
  menu: "dashboard-square-edit-stroke-rounded.png",
  notification: "notification-01-stroke-rounded.png",
  project: "folder-01-stroke-rounded.png",
  refresh: "cloud-saving-done-01-stroke-rounded.png",
  save: "bookmark-02-stroke-rounded.png",
  search: "search-01-stroke-rounded.png",
  security: "file-key-stroke-rounded.png",
  settings: "settings-02-stroke-rounded.png",
  social: "user-group-stroke-rounded.png",
  tag: "label-important-stroke-rounded.png",
  trash: "dashboard-square-remove-stroke-rounded.png",
  upload: "upload-01-stroke-rounded.png",
  user: "user-stroke-rounded.png",
  video: "file-video-camera-stroke-rounded.png"
};

export function getIconUrl(name) {
  const fileName = iconMap[name] || iconMap.archive;
  return `${import.meta.env.BASE_URL}assets/IconsNew/${fileName}`;
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
