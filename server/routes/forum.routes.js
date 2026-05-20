const express = require("express");
const { requireAuth, optionalAuth } = require("../middleware/auth.middleware");
const { writeLimiter } = require("../middleware/rateLimit.middleware");
const forumService = require("../services/forum.service");

const router = express.Router();

router.get("/posts", optionalAuth, async (req, res, next) => {
  try {
    const data = await forumService.listPosts(req.auth?.userId || null, req.query);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

router.post("/posts", requireAuth, writeLimiter, async (req, res, next) => {
  try {
    const post = await forumService.createPost(req.user.id, req.body);
    res.status(201).json({ ok: true, data: { post } });
  } catch (error) {
    next(error);
  }
});

router.get("/posts/:postId", optionalAuth, async (req, res, next) => {
  try {
    const post = await forumService.getPost(req.params.postId, req.auth?.userId || null);
    res.json({ ok: true, data: { post } });
  } catch (error) {
    next(error);
  }
});

router.post("/posts/:postId/like", requireAuth, writeLimiter, async (req, res, next) => {
  try {
    const data = await forumService.toggleLike(req.params.postId, req.user.id);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

router.delete("/posts/:postId/like", requireAuth, writeLimiter, async (req, res, next) => {
  try {
    const data = await forumService.removeLike(req.params.postId, req.user.id);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

router.post("/posts/:postId/save", requireAuth, writeLimiter, async (req, res, next) => {
  try {
    const data = await forumService.toggleSave(req.params.postId, req.user.id);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

router.delete("/posts/:postId/save", requireAuth, writeLimiter, async (req, res, next) => {
  try {
    const data = await forumService.removeSave(req.params.postId, req.user.id);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

router.get("/posts/:postId/comments", optionalAuth, async (req, res, next) => {
  try {
    const comments = await forumService.listComments(req.params.postId, req.auth?.userId || null);
    res.json({ ok: true, data: { comments } });
  } catch (error) {
    next(error);
  }
});

router.post("/posts/:postId/comments", requireAuth, writeLimiter, async (req, res, next) => {
  try {
    const comment = await forumService.createComment(req.params.postId, req.user.id, req.body);
    res.status(201).json({ ok: true, data: { comment } });
  } catch (error) {
    next(error);
  }
});

router.delete("/comments/:commentId", requireAuth, async (req, res, next) => {
  try {
    const result = await forumService.deleteComment(req.params.commentId, req.user.id);
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
