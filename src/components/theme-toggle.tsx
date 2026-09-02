'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/i18n-provider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { messages } = useI18n();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={theme === 'dark' ? messages.common.lightMode : messages.common.darkMode}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </Button>
  );
}
