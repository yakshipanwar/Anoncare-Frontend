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