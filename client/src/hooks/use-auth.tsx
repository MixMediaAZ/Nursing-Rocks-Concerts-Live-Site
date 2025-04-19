import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

interface User {
  id: number;
  email: string;
  isVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoggedIn: boolean; // Alias for isAuthenticated
  isVerified: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoggedIn: false,
  isVerified: false,
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/auth/status"],
  });

  const isAuthenticated = !!data?.isAuthenticated;

  const authStatus = {
    user: data?.user || null,
    isAuthenticated,
    isLoggedIn: isAuthenticated, // Alias for isAuthenticated
    isVerified: !!data?.isVerified,
    isLoading,
  };

  return (
    <AuthContext.Provider value={authStatus}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};