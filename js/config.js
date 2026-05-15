(function () {
  const isLocalHost = ["localhost", "127.0.0.1", ""].includes(window.location.hostname) || window.location.protocol === "file:";
  const onlineBackend = "";
  window.ROA_CONFIG = Object.assign({
    LOCAL_API_URL: "http://localhost:3000",
    PRODUCTION_API_URL: onlineBackend,
    API_URL: isLocalHost ? "http://localhost:3000" : onlineBackend
  }, window.ROA_CONFIG || {});
})();
