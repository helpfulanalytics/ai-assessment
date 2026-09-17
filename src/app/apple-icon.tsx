import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "180px",
          height: "180px",
          borderRadius: "40px",
          background: "#0d9488",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="96" height="86" viewBox="0 0 18 16" fill="none">
          <path d="M9 1L17 15H1L9 1Z" fill="white" fillOpacity="0.95" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
