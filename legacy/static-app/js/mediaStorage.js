(function () {
  const VIDEO_LIMIT = 8 * 1024 * 1024;

  function classify(file) {
    if ((file.type || "").startsWith("video/")) return "video";
    return "image";
  }

  function validate(file) {
    const kind = classify(file);
    if (kind === "video" && file.size > VIDEO_LIMIT) {
      return { ok: false, message: "El video es grande para localStorage. Usa un clip menor a 8 MB para esta version local." };
    }
    return { ok: true };
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const valid = validate(file);
      if (!valid.ok) {
        resolve({ error: valid.message, file });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve({
        id: window.ROA.Storage.uid(classify(file)),
        name: file.name.replace(/\.[^.]+$/, ""),
        description: "",
        kind: classify(file),
        type: classify(file),
        mimeType: file.type,
        data: reader.result,
        src: reader.result,
        tags: [],
        associated: [],
        relatedFiles: [],
        size: file.size,
        uploadedAt: window.ROA.Storage.now(),
        visibility: "inherit"
      });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  window.ROA = window.ROA || {};
  window.ROA.MediaStorage = { VIDEO_LIMIT, classify, validate, readFile };
})();
