import { headers } from "next/headers";

export const MONTH = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const nowDateString = () => {
  const dt = new Date();
  return `${dt.getDate().toString().padStart(2, "0")} ${
    MONTH[dt.getMonth()]
  } ${dt.getFullYear()}`;
};

export const getClientIP = () => {
  const FALLBACK_IP_ADDRESS = "0.0.0.0";
  const forwardedFor = headers().get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0] ?? FALLBACK_IP_ADDRESS;
  }

  return headers().get("x-real-ip") ?? FALLBACK_IP_ADDRESS;
};

export const getUserAgent = () => {
  return headers().get("user-agent") ?? "";
};
