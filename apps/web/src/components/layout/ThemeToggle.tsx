import { useCallback, useEffect } from 'react';
import { IconButton, IconButtonProps, Tooltip } from '@mui/material';
import { useThemeStore } from '@/lib/store';
import useStore from '@/store/useStore';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';

interface ThemeToggleProps extends Omit<IconButtonProps, 'onClick'> {}

export function ThemeToggle(props: ThemeToggleProps) {
  // Get theme mode from store
  const { themePreference, setThemePreference } = useThemeStore();
  // Also update the main app store for backward compatibility
  const setThemeMode = useStore((state: any) => state.setThemeMode);
  
  // Toggle theme between light, dark, system
  const handleToggle = useCallback(() => {
    const nextMode = themePreference === 'light' ? 'dark' : 
                     themePreference === 'dark' ? 'system' : 'light';
    setThemePreference(nextMode);
    setThemeMode(nextMode); // Keep other store in sync
  }, [themePreference, setThemePreference, setThemeMode]);

  // Sync Tailwind dark mode class
  useEffect(() => {
    const isDark = themePreference === 'dark' || 
      (themePreference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
    document.documentElement.classList.toggle('dark', isDark);
  }, [themePreference]);

  // Determine which icon to show based on theme
  const ThemeIcon = themePreference === 'light' 
    ? LightModeIcon 
    : themePreference === 'dark' 
      ? DarkModeIcon 
      : SettingsBrightnessIcon;
      
  const tooltipText = `Switch to ${
    themePreference === 'light' 
      ? 'dark' 
      : themePreference === 'dark' 
        ? 'system' 
        : 'light'
  } theme`;

  return (
    <Tooltip title={tooltipText}>
      <IconButton 
        {...props}
        onClick={handleToggle} 
        aria-label="Toggle theme"
        color="inherit"
        size="medium"
      >
        <ThemeIcon />
      </IconButton>
    </Tooltip>
  );
}