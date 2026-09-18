"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "./client";
import { firestoreService, FirestoreUser } from "./firestore-service";
import { useBookingStore } from "@/stores/booking-store";

interface AuthContextType {
  user: User | null;
  userProfile: FirestoreUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  openPhoneAuth: (context?: "CUSTOMER" | "VENDOR", returnTo?: string) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signOut: async () => {},
  openPhoneAuth: () => {},
  refreshProfile: async () => {},
});

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);

  const { openAuthModal } = useBookingStore();

  const fetchProfile = async (firebaseUser: User) => {
    try {
      let profile = await firestoreService.getUser(firebaseUser.uid);
      if (!profile) {
        profile = await firestoreService.syncUser({
          uid: firebaseUser.uid,
          phoneNumber: firebaseUser.phoneNumber,
        });
      }
      setUserProfile(profile);
    } catch (err) {
      console.error("[FirebaseAuth] Failed to fetch/sync Firestore profile:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      console.error("[FirebaseAuth] Sign out error:", err);
    }
  };

  const handleOpenPhoneAuth = (context: "CUSTOMER" | "VENDOR" = "CUSTOMER", returnTo?: string) => {
    openAuthModal(context, returnTo);
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
        userProfile,
        loading,
        signOut: handleSignOut,
        openPhoneAuth: handleOpenPhoneAuth,
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
