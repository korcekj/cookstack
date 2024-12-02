import React from 'react';
import { useLocaleStorage } from '@/hooks/use-locale-storage';

export const useTimer = (name: string, seconds = 0) => {
  const [enabled, setEnabled] = React.useState(false);
  const [defaultRemaining, setDefaultRemaining] = React.useState(seconds);
  const [remaining, setRemaining] = useLocaleStorage(
    `timer:${name}`,
    defaultRemaining,
  );

  const set = React.useCallback(
    (value: number) => {
      setDefaultRemaining(value);
      setRemaining(value);
    },
    [setRemaining],
  );

  const start = React.useCallback(() => {
    setEnabled(true);
  }, []);

  const pause = React.useCallback(() => {
    setEnabled(false);
  }, []);

  const reset = React.useCallback(() => {
    setEnabled(false);
    setRemaining(defaultRemaining);
  }, [defaultRemaining, setRemaining]);

  React.useEffect(() => {
    if (enabled) {
      const interval = setInterval(() => {
        if (remaining <= 0) {
          setEnabled(false);
          clearInterval(interval);
          return;
        }
        setRemaining(remaining - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [enabled, remaining, setRemaining]);

  return { remaining, start, pause, reset, set };
};
