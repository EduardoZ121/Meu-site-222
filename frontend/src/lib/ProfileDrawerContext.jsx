import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ProfileDrawerContext = createContext(null);

export function ProfileDrawerProvider({ children }) {
  const [open, setOpen] = useState(false);
  const openDrawer = useCallback(() => setOpen(true), []);
  const closeDrawer = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, setOpen, openDrawer, closeDrawer }),
    [open, openDrawer, closeDrawer],
  );

  return (
    <ProfileDrawerContext.Provider value={value}>
      {children}
    </ProfileDrawerContext.Provider>
  );
}

export function useProfileDrawer() {
  const ctx = useContext(ProfileDrawerContext);
  if (!ctx) {
    return {
      open: false,
      setOpen: () => {},
      openDrawer: () => {},
      closeDrawer: () => {},
    };
  }
  return ctx;
}
