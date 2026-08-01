import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AssessAI — Find the $10K+ Your Business Is Leaking in 5 Days";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#061b31",
          position: "relative",
          overflow: "hidden",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Background radial glow */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-80px",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(83,58,253,0.45) 0%, transparent 65%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            left: "40px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(128,135,255,0.2) 0%, transparent 65%)",
            display: "flex",
          }}
        />

        {/* Grid pattern overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 72px",
            height: "100%",
            position: "relative",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "#533afd",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 14 14" fill="none">
                <path d="M7 2L12 11H2L7 2Z" fill="white" fillOpacity="0.95" />
              </svg>
            </div>
            <span style={{ fontSize: "22px", fontWeight: 600, color: "#ffffff", letterSpacing: "-0.01em" }}>
              AssessAI
            </span>
          </div>

          {/* Main copy */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(83,58,253,0.2)",
                border: "1px solid rgba(83,58,253,0.4)",
                borderRadius: "20px",
                padding: "6px 16px",
                width: "fit-content",
              }}
            >
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#8087ff", display: "flex" }} />
              <span style={{ fontSize: "14px", fontWeight: 500, color: "#8087ff", letterSpacing: "0.3px" }}>
                AI BUSINESS ASSESSMENT
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <h1
                style={{
                  fontSize: "64px",
                  fontWeight: 300,
                  color: "#ffffff",
                  lineHeight: 1.05,
                  letterSpacing: "-0.03em",
                  margin: 0,
                }}
              >
                Your business has a leak.{"\n"}
                <span style={{ color: "#8087ff" }}>We&apos;ll find it in 5 days.</span>
              </h1>
              <p
                style={{
                  fontSize: "22px",
                  fontWeight: 400,
                  color: "#94a3b8",
                  margin: 0,
                  lineHeight: 1.5,
                  maxWidth: "700px",
                }}
              >
                Businesses doing $500K–$10M bleed $8K–$20K/year. We audit everything and hand you a fix-it plan — guaranteed.
              </p>
            </div>
          </div>

          {/* Bottom stats row */}
          <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
            {[
              { value: "214+", label: "Audits delivered" },
              { value: "$10,400", label: "Avg. savings found" },
              { value: "97%", label: "Satisfaction rate" },
              { value: "30-day", label: "Money-back guarantee" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  padding: "0 36px",
                  borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.1)" : "none",
                }}
              >
                <span style={{ fontSize: "30px", fontWeight: 300, color: "#533afd", letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {stat.value}
                </span>
                <span style={{ fontSize: "13px", color: "#64748b" }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
