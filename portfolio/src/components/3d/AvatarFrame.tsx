// motion v12 (formerly framer-motion) — import from "motion/react"
import { motion } from "motion/react";

interface AvatarFrameProps {
  imageSrc?: string;
  alt?: string;
}

const AvatarFrame = ({
  imageSrc,
  alt = "Profile photo",
}: AvatarFrameProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: "relative", width: 180, height: 180, margin: "0 auto 2rem" }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          inset: -40,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,245,196,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Outer dashed ring (spins reverse) */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute",
          inset: -18,
          borderRadius: "50%",
          border: "0.5px dashed rgba(0,245,196,0.2)",
        }}
      />

      {/* Middle gradient ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute",
          inset: -8,
          borderRadius: "50%",
          padding: 2,
          background: "linear-gradient(135deg, #00f5c4, #a855f7, #00f5c4)",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />

      {/* Avatar image */}
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          overflow: "hidden",
          background: "linear-gradient(135deg, #1a2744, #2d1b69)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "4rem",
          position: "relative",
        }}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={alt}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "50%",
            }}
          />
        ) : (
          <span role="img" aria-label="Developer">
            🧑‍💻
          </span>
        )}

        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background:
              "linear-gradient(135deg, rgba(0,245,196,0.12), rgba(168,85,247,0.12))",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Orbiting dot */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute",
          inset: -14,
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: -4,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--neon)",
            boxShadow: "0 0 12px var(--neon)",
            transform: "translateY(-50%)",
          }}
        />
      </motion.div>
    </motion.div>
  );
};

export default AvatarFrame;
