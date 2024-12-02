import React from 'react';

export const useLocaleStorage = <_, T>(
  key: string,
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [value, setValue] = React.useState<T>(defaultValue);
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    setInitialized(true);
    const storedValue = localStorage.getItem(key);
    if (storedValue) setValue(JSON.parse(storedValue) as T);
  }, [key]);

  React.useEffect(() => {
    if (value !== undefined && value !== null && initialized) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, [key, value, initialized]);

  return [value, setValue];
};
