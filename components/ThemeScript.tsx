'use client';

import { useEffect } from 'react';

export function ThemeScript() {
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const isDark = stored === 'dark';
    const htmlElement = document.documentElement;
    if (isDark) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  }, []);

  return null;
}
