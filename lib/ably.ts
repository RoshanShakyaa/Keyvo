"use client";

import Ably from "ably";

export const getAblyClient = () => {
  return new Ably.Realtime({
    authUrl: "/api/ably/token",
  });
};
