import { cookies } from "next/headers";
import { api } from "./api";

export const oauthAccount = async () => {
  const cookieStore = await cookies();
  await api.get("/api/youtube/connect", {
    headers: {
      cookie: cookieStore.toString(),
    },
  });
};
