// @ts-nocheck
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "organization" | "student" | "volunteer" | "mentor";
};

type AuthContextType = {
  user: User | null;
  signup: (
    name: string,
    email: string,
    password: string,
    role: User["role"]
  ) => boolean;
  login: (email: string, password: string) => User | null;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  /* ================= RESTORE SESSION ================= */

  useEffect(() => {
    const session = localStorage.getItem("vidzel_session");
    if (session) {
      setUser(JSON.parse(session));
    }
  }, []);

  /* ================= HELPERS ================= */

  const getAccounts = (): User[] =>
    JSON.parse(localStorage.getItem("vidzel_accounts") || "[]");

  const saveAccounts = (accounts: User[]) =>
    localStorage.setItem("vidzel_accounts", JSON.stringify(accounts));

  const getProfiles = () =>
    JSON.parse(localStorage.getItem("vidzel_profiles") || "[]");

  const saveProfiles = (profiles: any[]) =>
    localStorage.setItem("vidzel_profiles", JSON.stringify(profiles));

  /* ================= SIGNUP ================= */

  const signup = (
    name: string,
    email: string,
    password: string,
    role: User["role"]
  ) => {
    const accounts = getAccounts();
    const normalizedEmail = email.trim().toLowerCase();

    if (accounts.some((u) => u.email === normalizedEmail)) {
      return false;
    }

    const newUser: User = {
      id: Date.now().toString(),
      name: name.trim(),
      email: normalizedEmail,
      password: password.trim(),
      role,
    };

    // 1️⃣ Save account
    const updatedAccounts = [...accounts, newUser];
    saveAccounts(updatedAccounts);

    // 2️⃣ AUTO-CREATE PROFILE (NON-ORGANIZATIONS ONLY)
    if (role !== "organization") {
      const profiles = getProfiles();

      const alreadyExists = profiles.some(
        (p: any) => p.userId === newUser.id
      );

      if (!alreadyExists) {
        profiles.push({
          userId: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          bio: "",
          location: "",
          skills: [],
          createdAt: new Date().toISOString(),
        });

        saveProfiles(profiles);
      }
    }

    // 3️⃣ Start session
    localStorage.setItem("vidzel_session", JSON.stringify(newUser));
    setUser(newUser);

    return true;
  };

  /* ================= LOGIN ================= */

  const login = (email: string, password: string): User | null => {
    const accounts = getAccounts();

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    const found = accounts.find(
      (u) =>
        u.email === normalizedEmail &&
        u.password === normalizedPassword
    );

    if (!found) return null;

    localStorage.setItem("vidzel_session", JSON.stringify(found));
    setUser(found);

    return found;
  };

  /* ================= LOGOUT ================= */

  const logout = () => {
    localStorage.removeItem("vidzel_session");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};