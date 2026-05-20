const express = require("express");
const { requireAuth } = require("../middleware/auth.middleware");
const documentsService = require("../services/documents.service");

const router = express.Router();

router.get("/project/:projectId", requireAuth, async (req, res, next) => {
  try {
    const documents = await documentsService.listDocuments(req.params.projectId, req.user.id);
    res.json({ ok: true, data: { documents } });
  } catch (error) {
    next(error);
  }
});

router.post("/project/:projectId", requireAuth, async (req, res, next) => {
  try {
    const document = await documentsService.createDocument(req.params.projectId, req.user.id, req.body);
    res.status(201).json({ ok: true, data: { document } });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const document = await documentsService.getDocument(req.params.id, req.user.id);
    res.json({ ok: true, data: { document } });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const document = await documentsService.updateDocument(req.params.id, req.user.id, req.body);
    res.json({ ok: true, data: { document } });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const result = await documentsService.deleteDocument(req.params.id, req.user.id);
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
