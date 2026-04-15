import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getToken } from "@/lib/token-utils";

interface User {
  id: number;
  email: string;
  isVerified?: boolean;
}

interface AuthStatusResponse {
  isAuthenticated: boolean;
  isVerified: boolean;
  user?: User;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoggedIn: boolean;
  isVerified: boolean;
  isLoading: boolean;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoggedIn: false,
  isVerified: false,
  isLoading: true,
  refetch: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data, isLoading, refetch } = useQuery<AuthStatusResponse>({
    queryKey: ["/api/auth/status"],
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const isAuthenticated = !!data?.isAuthenticated;

  const authStatus: AuthContextType = {
    user: data?.user || null,
    isAuthenticated,
    isLoggedIn: isAuthenticated,
    isVerified: !!data?.isVerified,
    isLoading,
    refetch,
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