import { apiClient } from "./apiClient";

export const forumApi = {
  posts: (params = {}) => {
    const search = new URLSearchParams(params);
    return apiClient.get(`/forum/posts?${search.toString()}`);
  },
  createPost: (payload) => apiClient.post("/forum/posts", payload),
  getPost: (postId) => apiClient.get(`/forum/posts/${postId}`),
  like: (postId) => apiClient.post(`/forum/posts/${postId}/like`, {}),
  unlike: (postId) => apiClient.delete(`/forum/posts/${postId}/like`),
  save: (postId) => apiClient.post(`/forum/posts/${postId}/save`, {}),
  unsave: (postId) => apiClient.delete(`/forum/posts/${postId}/save`),
  comments: (postId) => apiClient.get(`/forum/posts/${postId}/comments`),
  comment: (postId, payload) => apiClient.post(`/forum/posts/${postId}/comments`, payload),
  deleteComment: (commentId) => apiClient.delete(`/forum/comments/${commentId}`)
};
