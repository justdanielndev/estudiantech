"use client"

import { useTheme } from "next-themes"
import { useEffect } from "react"

export default function ThemeSyncer({ theme }: { theme: string }) {
  const { setTheme } = useTheme();
  useEffect(() => {
    if (theme) setTheme(theme);
  }, [theme, setTheme]);
  return null;
}
