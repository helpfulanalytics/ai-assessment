/** Preview variant: G1 — trimmed to this variant's family + styles. */
import type { CSSProperties } from "react";
import styles from "./Orb.module.css";

/** The stage the geometry is tuned on; --orb-k scales it to `size`. */
const STAGE = 28;

/** Default rendered size — 20×20 indicator box. */
const SIZE = 20;

export type HelixVariant = "G1";
export type OrbVariant = HelixVariant;

export const ORB_TASKS: Record<OrbVariant, string> = {
  G1: "Processing",
};

const GLOBE_R = 8.5;
const GLOBE_TILT = (14 * Math.PI) / 180;
const GLOBE_STEPS = 8;

const GLOBE_RINGS: { lat: number; count: number }[] = [
  { lat: 52, count: 8 },
  { lat: 26, count: 8 },
  { lat: 0, count: 8 },
  { lat: -26, count: 8 },
  { lat: -52, count: 8 },
];

interface GlobeDot {
  key: number;
  style: Record<string, string>;
}

function projectGlobe(x: number, y: number, z: number, spin: number) {
  const cs = Math.cos(spin);
  const ss = Math.sin(spin);
  const x1 = x * cs - z * ss;
  const z1 = x * ss + z * cs;
  const y1 = y;
  const ct = Math.cos(GLOBE_TILT);
  const st = Math.sin(GLOBE_TILT);
  return {
    x: x1,
    y: y1 * ct - z1 * st,
    z: y1 * st + z1 * ct,
  };
}

function globeOpacity(z: number) {
  const t = Math.max(0, Math.min(1, (z / GLOBE_R + 0.15) / 1.15));
  return 0.12 + 0.88 * t * t;
}

/** G1's spin: every dot orbits forward through a full turn, no per-ring reversal. */
function globeKeyframeStyle(x0: number, y0: number, z0: number): Record<string, string> {
  const style: Record<string, string> = {};
  for (let k = 0; k < GLOBE_STEPS; k++) {
    const phase = k / GLOBE_STEPS;
    const p = projectGlobe(x0, y0, z0, phase * Math.PI * 2);
    style["--g" + k + "x"] = p.x.toFixed(2) + "px";
    style["--g" + k + "y"] = (-p.y).toFixed(2) + "px";
    style["--g" + k + "o"] = globeOpacity(p.z).toFixed(3);
  }
  return style;
}

function globeDots(): GlobeDot[] {
  const dots: GlobeDot[] = [];
  let idx = 0;
  for (const ring of GLOBE_RINGS) {
    const latRad = (ring.lat * Math.PI) / 180;
    const y0 = Math.sin(latRad) * GLOBE_R;
    const ringR = Math.cos(latRad) * GLOBE_R;
    for (let j = 0; j < ring.count; j++) {
      const lon = (j / ring.count) * Math.PI * 2;
      const style = globeKeyframeStyle(Math.cos(lon) * ringR, y0, Math.sin(lon) * ringR);
      dots.push({ key: idx, style });
      idx++;
    }
  }
  return dots;
}

export interface OrbProps {
  variant?: OrbVariant;
  /** Rendered edge length in px. The 28px geometry scales to fit. */
  size?: number;
  /** Accessible label, and the status text when `pill` is set. */
  label?: string;
  /** Wraps the orb and its label in a status pill. */
  pill?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Orb({ variant = "G1", size = SIZE, label, pill, className, style }: OrbProps) {
  const text = label ?? ORB_TASKS[variant] + "…";
  return (
    <span
      className={styles.root + (className ? " " + className : "")}
      data-pill={pill ? "" : undefined}
      style={style}
    >
      <span
        className={styles.glyph}
        // In pill form the visible label already carries the meaning, so
        // the glyph steps out of the accessibility tree.
        role={pill ? undefined : "img"}
        aria-label={pill ? undefined : text}
        aria-hidden={pill ? true : undefined}
        style={{ width: size, height: size, "--orb-k": size / STAGE } as CSSProperties}
      >
        <span className={styles.helix} data-variant={variant}>
          {globeDots().map((d) => (
            <span key={d.key} className={styles.helixDot} style={d.style as CSSProperties} />
          ))}
        </span>
      </span>
      {pill && <span className={styles.pillLabel}>{text}</span>}
    </span>
  );
}

/* Usage:
       <Orb variant="G1" />
       <Orb variant="G1" label="…" pill />
 */
