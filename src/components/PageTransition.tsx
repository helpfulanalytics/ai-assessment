"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

const STYLE = `
  @keyframes pageIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes barLoad {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
`;

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayed, setDisplayed] = useState(children);
  const [animating, setAnimating] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;

    setShowBar(true);
    setAnimating(true);

    const t1 = setTimeout(() => {
      setDisplayed(children);
      setAnimating(false);
    }, 180);

    const t2 = setTimeout(() => setShowBar(false), 600);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [pathname, children]);

  const [prevChildren, setPrevChildren] = useState(children);
  if (children !== prevChildren) {
    setPrevChildren(children);
    setDisplayed(children);
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />

      {/* Top loading bar */}
      {showBar && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, height: "2px",
          zIndex: 9999, background: "rgba(83,58,253,0.12)",
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            background: "linear-gradient(90deg, #533afd, #8087ff)",
            transformOrigin: "left center",
            animation: "barLoad 500ms cubic-bezier(0.23, 1, 0.32, 1) forwards",
          }} />
        </div>
      )}

      <div style={{
        opacity: animating ? 0 : 1,
        transform: animating ? "translateY(6px)" : "none",
        transition: "opacity 180ms ease, transform 180ms cubic-bezier(0.23, 1, 0.32, 1)",
        willChange: animating ? "opacity, transform" : "auto",
      }}>
        {displayed}
      </div>
    </>
  );
}
