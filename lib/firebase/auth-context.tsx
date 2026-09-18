"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "./client";
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  sendPasswordReset,
  signOutUser,
  AuthResponse,
} from "./auth-service";
import { getSupabaseUserProfile, syncFirebaseUserToSupabase } from "@/lib/actions/auth.actions";
import { useBookingStore } from "@/stores/booking-store";

interface AuthContextType {
  user: User | null;
  dbUser: any | null;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<AuthResponse>;
  signUpWithEmail: (email: string, pass: string, name: string, role?: "CUSTOMER" | "VENDOR") => Promise<AuthResponse>;
  signInWithGoogle: (role?: "CUSTOMER" | "VENDOR") => Promise<AuthResponse>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  signOut: () => Promise<void>;
  openAuth: (context?: "CUSTOMER" | "VENDOR", returnTo?: string) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  dbUser: null,
  loading: true,
  signInWithEmail: async () => ({ success: false }),
  signUpWithEmail: async () => ({ success: false }),
  signInWithGoogle: async () => ({ success: false }),
  sendPasswordReset: async () => ({ success: false }),
  signOut: async () => {},
  openAuth: () => {},
  refreshProfile: async () => {},
});

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const { openAuthModal } = useBookingStore();

  const fetchProfile = async (firebaseUser: User) => {
    try {
      let res = await getSupabaseUserProfile(firebaseUser.uid);
      if (!res.success || !res.user) {
        // Auto-sync into Supabase if not yet recorded
        const syncRes = await syncFirebaseUserToSupabase({
          uid: firebaseUser.uid,
          email: firebaseUser.email || `${firebaseUser.uid.slice(0, 8)}@user.thebookmyvenues.in`,
          name: firebaseUser.displayName || undefined,
          phone: firebaseUser.phoneNumber || undefined,
        });
        if (syncRes.success && syncRes.user) {
          setDbUser(syncRes.user);
        }
      } else {
        setDbUser(res.user);
      }
    } catch (err) {
      console.error("[FirebaseAuth] Failed to sync Supabase user profile:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser);
      } else {
        setDbUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignInWithEmail = async (email: string, pass: string): Promise<AuthResponse> => {
    const res = await signInWithEmail(email, pass);
    if (res.success && res.user) {
      setUser(res.user);
      if (res.dbUser) setDbUser(res.dbUser);
    }
    return res;
  };

  const handleSignUpWithEmail = async (
    email: string,
    pass: string,
    name: string,
    role: "CUSTOMER" | "VENDOR" = "CUSTOMER"
  ): Promise<AuthResponse> => {
    const res = await signUpWithEmail(email, pass, name, role);
    if (res.success && res.user) {
      setUser(res.user);
      if (res.dbUser) setDbUser(res.dbUser);
    }
    return res;
  };

  const handleSignInWithGoogle = async (role: "CUSTOMER" | "VENDOR" = "CUSTOMER"): Promise<AuthResponse> => {
    const res = await signInWithGoogle(role);
    if (res.success && res.user) {
      setUser(res.user);
      if (res.dbUser) setDbUser(res.dbUser);
    }
    return res;
  };

  const handleSignOut = async () => {
    await signOutUser();
    setUser(null);
    setDbUser(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        dbUser,
        loading,
        signInWithEmail: handleSignInWithEmail,
        signUpWithEmail: handleSignUpWithEmail,
        signInWithGoogle: handleSignInWithGoogle,
        sendPasswordReset,
        signOut: handleSignOut,
        openAuth: openAuthModal,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  return useContext(AuthContext);
}
