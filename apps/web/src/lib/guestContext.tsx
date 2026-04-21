import { createContext, useContext, useState, ReactNode } from 'react';

interface GuestUser {
  isGuest: boolean;
  id: string;
}

interface GuestContextType {
  guestUser: GuestUser | null;
  setGuestUser: (user: GuestUser | null) => void;
  isGuestMode: boolean;
  enableGuestMode: () => void;
  disableGuestMode: () => void;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

export function GuestProvider({ children }: { children: ReactNode }) {
  const [guestUser, setGuestUser] = useState<GuestUser | null>(null);
  const [isGuestMode, setIsGuestMode] = useState(false);

  const enableGuestMode = () => {
    const guestId = 'guest_' + Math.random().toString(36).substr(2, 9);
    setGuestUser({ isGuest: true, id: guestId });
    setIsGuestMode(true);
    sessionStorage.setItem('guestUser', JSON.stringify({ isGuest: true, id: guestId }));
  };

  const disableGuestMode = () => {
    setGuestUser(null);
    setIsGuestMode(false);
    sessionStorage.removeItem('guestUser');
  };

  return (
    <GuestContext.Provider
      value={{
        guestUser,
        setGuestUser,
        isGuestMode,
        enableGuestMode,
        disableGuestMode,
      }}
    >
      {children}
    </GuestContext.Provider>
  );
}

export function useGuestMode() {
  const context = useContext(GuestContext);
  if (context === undefined) {
    throw new Error('useGuestMode must be used within a GuestProvider');
  }
  return context;
}

export function isGuestAllowedRoute(pathname: string): boolean {
  const allowedRoutes = [
    '/quizzes',
    '/study-content',
    '/current-affairs',
    '/tests/attempt',
    '/', // Home page
    '/privacy',
    '/terms',
    '/signin'
  ];
  
  return allowedRoutes.some(route => pathname.startsWith(route));
}