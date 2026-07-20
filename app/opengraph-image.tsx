import { ImageResponse } from "next/og";

export const alt = "KasiStock AI — Turn limited cash into the right stock";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        background: "#f5f1e8",
        color: "#142b21",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#183f31",
            color: "white",
            fontSize: 42,
            fontWeight: 800,
          }}
        >
          K
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 42, fontWeight: 800 }}>KasiStock AI</div>
          <div style={{ fontSize: 23, color: "#52675f" }}>OpenAI Build Week 2026</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 72, lineHeight: 1.03, fontWeight: 800, maxWidth: 1000 }}>
          Turn limited cash into the right stock.
        </div>
        <div style={{ fontSize: 28, lineHeight: 1.35, color: "#40564d", maxWidth: 940 }}>
          Multimodal retail evidence, human verification, and deterministic budget optimisation for
          small retailers.
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, fontSize: 22 }}>
        <span style={{ padding: "12px 18px", background: "#ffffff", borderRadius: 999 }}>
          GPT-5.6 extraction
        </span>
        <span style={{ padding: "12px 18px", background: "#ffffff", borderRadius: 999 }}>
          Human authority
        </span>
        <span style={{ padding: "12px 18px", background: "#ffffff", borderRadius: 999 }}>
          Budget-safe orders
        </span>
      </div>
    </div>,
    size,
  );
}
