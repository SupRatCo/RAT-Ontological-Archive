import { apiClient } from "./apiClient";

export const collaboratorsApi = {
  friends: () => apiClient.get("/collaborators/friends"),
  requestFriend: (userId) => apiClient.post(`/collaborators/friends/${userId}`, {}),
  updateFriendship: (friendshipId, status) => apiClient.patch(`/collaborators/friends/${friendshipId}`, { status }),
  members: (projectId) => apiClient.get(`/collaborators/projects/${projectId}/members`),
  invite: (projectId, payload) => apiClient.post(`/collaborators/projects/${projectId}/invites`, payload),
  respondInvite: (inviteId, status) => apiClient.patch(`/collaborators/invites/${inviteId}`, { status })
};
