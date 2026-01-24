import api from "./axios";

export const registerVolunteer = (formData) => {
  return api.post("/auth/volunteer/register/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
export const registerSeeker = (data) => {
  return api.post("/auth/seeker/register/", data);
};

export const loginUser = (username, password) => {
  return api.post("/auth/login/", { username, password });
};