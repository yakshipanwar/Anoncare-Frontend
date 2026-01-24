import api from "./axios";

export const getMyVerificationStatus = (token) => {
  return api.get("/verification/my-status/", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};