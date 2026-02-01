import api from "./axios";

export const getMySession = async (token) => {
  return api.get("/chat/my-session/", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const requestSession = async (token) => {
  return api.post(
    "/chat/request/",
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

export const getPendingRequests = () => {
  return api.get("/chat/pending-requests/");
};

export const acceptSession = (sessionId) => {
  return api.post(`/chat/accept/${sessionId}/`);
};

export const endSession = (sessionId, token) => {
  return api.post(
    `/chat/end-session/${sessionId}/`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};