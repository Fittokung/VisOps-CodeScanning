import { ImageResponse } from "next/og";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 16, // ขนาดตัวอักษร
          background: "linear-gradient(to bottom right, #2563eb, #1e40af)", // blue-600 to blue-800
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          borderRadius: "8px", // rounded-lg
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        VS
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  );
}
