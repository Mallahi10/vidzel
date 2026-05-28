"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "@/lib/supabaseClient";

/* ================= TYPES ================= */

type Role =
  | "organization"
  | "student"
  | "volunteer"
  | "mentor";

type User = {
  id: string;
  email: string;
  role: Role;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signup: (
    email: string,
    password: string,
    role: Role
  ) => Promise<boolean>;
  login: (
    email: string,
    password: string,
    expectedRole?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
};

/* ================= CONTEXT ================= */

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

/* ================= PROVIDER ================= */

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* ================= AUTH LISTENER ONLY ================= */

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setLoading(false);
        return;
      }

      if (session?.user) {
        const role =
          (session.user.user_metadata?.role as Role) || "volunteer";

        setUser({
          id: session.user.id,
          email: session.user.email!,
          role,
        });
      } else if (event === "INITIAL_SESSION") {
        setUser(null);
      }

      if (event === "INITIAL_SESSION") {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /* ================= SIGNUP ================= */

  const signup = async (
    email: string,
    password: string,
    role: Role
  ): Promise<boolean> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role },
      },
    });

    if (error) {
      alert(error.message);
      return false;
    }

    return true;
  };

  /* ================= LOGIN ================= */

  const login = async (
    email: string,
    password: string,
    expectedRole?: string
  ): Promise<{ success: boolean; error?: string }> => {
    // 1. Authentification avec Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: "Invalid email or password" };
    }

    // 2. Vérification stricte du rôle si un rôle est attendu
    if (expectedRole && data.user) {
      const userRole = data.user.user_metadata?.role;

      if (userRole !== expectedRole) {
        // Le rôle ne correspond pas, on annule la connexion immédiatement
        await supabase.auth.signOut();
        setUser(null); // On vide l'état React pour éviter les conflits
        return { 
          success: false, 
          error: `Access denied. Please log in through the ${userRole} portal.` 
        };
      }
    }

    return { success: true };
  };
  /* ================= LOGOUT ================= */

  const logout = async () => {
    // 1. On vide l'état React de manière synchrone en premier
    setUser(null);
    
    // 2. On déclenche la déconnexion Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("Erreur de déconnexion:", error.message);
      alert(error.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signup,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};