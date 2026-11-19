import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#2563EB",
          borderRadius: "36px"
        }}
      >
        <svg
          width="112"
          height="112"
          viewBox="0 0 116 116"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 8C15.5817 8 12 11.5817 12 16V100C12 104.418 15.5817 108 20 108H96C100.418 108 104 104.418 104 100V36L76 8H20Z"
            fill="#FFFFFF"
          />
          <path
            d="M76 8V28C76 32.4183 79.5817 36 84 36H104L76 8Z"
            fill="#BFDBFE"
          />
          <path
            d="M36 66L50 80L82 46"
            stroke="#2563EB"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    {
      ...size
    }
  );
}
