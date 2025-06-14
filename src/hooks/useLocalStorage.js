import { useState, useEffect } from 'react';
import { Criptografar, Descriptografar } from '../Cripto';

export const useLocalStorage = (key, initialValue) => {
  // State to store our value
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      // Get from local storage by key
      const item = localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      if (item) {
        const decrypted = Descriptografar(item);
        return JSON.parse(decrypted);
      }
      return initialValue;
    } catch (error) {
      // If error also return initialValue
      // console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (valueToStore === null) {
        localStorage.removeItem(key);
      } else {
        const encrypted = Criptografar(JSON.stringify(valueToStore));
        localStorage.setItem(key, encrypted);
      }
    } catch (error) {
      // console.error(`Error setting localStorage key "${key}":`, error);
    }
  };
  
  // Listen for changes to this key in localStorage
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key) {
        try {
          if (e.newValue) {
            const decrypted = Descriptografar(e.newValue);
            setStoredValue(JSON.parse(decrypted));
          } else {
            setStoredValue(initialValue);
          }
        } catch (error) {
          // console.error(`Error handling storage change for key "${key}":`, error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]);

  return [storedValue, setValue];
};