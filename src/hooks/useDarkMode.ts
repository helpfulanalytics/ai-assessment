"use client";
import { useEffect, useState } from "react";

export function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("auditai-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return stored ? stored === "dark" : prefersDark;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const toggle = () => {
    setDark(d => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("auditai-theme", next ? "dark" : "light");
      return next;
    });
  };

  return { dark, toggle };
}
