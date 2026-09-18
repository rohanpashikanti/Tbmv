import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth";
import { auth } from "./client";
import { syncFirebaseUserToSupabase } from "@/lib/actions/auth.actions";

export interface AuthResponse {
  success: boolean;
  user?: User;
  dbUser?: any;
  error?: string;
}

/**
 * Sign up a new user with Firebase Email & Password, and sync with Supabase PostgreSQL.
 */
export async function signUpWithEmail(
  emailInput: string,
  passwordInput: string,
  nameInput: string,
  role: "CUSTOMER" | "VENDOR" = "CUSTOMER"
): Promise<AuthResponse> {
  const cleanEmail = emailInput.trim().toLowerCase();
  const cleanName = nameInput.trim();

  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { success: false, error: "Please enter a valid email address." };
  }
  if (passwordInput.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }
  if (!cleanName || cleanName.length < 2) {
    return { success: false, error: "Please enter your full name." };
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, passwordInput);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: cleanName });

      // Synchronize into Supabase PostgreSQL
      const syncRes = await syncFirebaseUserToSupabase({
        uid: cred.user.uid,
        email: cleanEmail,
        name: cleanName,
        role: role,
      });

      return {
        success: true,
        user: cred.user,
        dbUser: syncRes.user,
      };
    }

    return { success: false, error: "Account creation failed. Please try again." };
  } catch (err: any) {
    console.error(`[Firebase Auth] Sign Up error: [${err.code}] ${err.message}`);
    let userMsg = err.message || "Failed to create account.";

    if (err.code === "auth/email-already-in-use") {
      userMsg = "An account with this email address already exists. Please sign in instead.";
    } else if (err.code === "auth/invalid-email") {
      userMsg = "Invalid email address.";
    } else if (err.code === "auth/weak-password") {
      userMsg = "Password is too weak. Please use at least 6 characters.";
    }

    return { success: false, error: userMsg };
  }
}

/**
 * Sign in an existing user with Firebase Email & Password, and sync with Supabase PostgreSQL.
 */
export async function signInWithEmail(
  emailInput: string,
  passwordInput: string
): Promise<AuthResponse> {
  const cleanEmail = emailInput.trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { success: false, error: "Please enter a valid email address." };
  }
  if (!passwordInput) {
    return { success: false, error: "Please enter your password." };
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, passwordInput);
    if (cred.user) {
      // Synchronize into Supabase PostgreSQL
      const syncRes = await syncFirebaseUserToSupabase({
        uid: cred.user.uid,
        email: cleanEmail,
        name: cred.user.displayName || undefined,
      });

      return {
        success: true,
        user: cred.user,
        dbUser: syncRes.user,
      };
    }

    return { success: false, error: "Sign in failed. Please try again." };
  } catch (err: any) {
    console.error(`[Firebase Auth] Sign In error: [${err.code}] ${err.message}`);
    let userMsg = err.message || "Failed to sign in.";

    if (
      err.code === "auth/user-not-found" ||
      err.code === "auth/wrong-password" ||
      err.code === "auth/invalid-credential"
    ) {
      userMsg = "Invalid email or password. Please check your credentials and try again.";
    } else if (err.code === "auth/too-many-requests") {
      userMsg = "Too many failed attempts. Please reset your password or try again later.";
    }

    return { success: false, error: userMsg };
  }
}

/**
 * Sign in with Google Popup and sync to Supabase PostgreSQL.
 */
export async function signInWithGoogle(role: "CUSTOMER" | "VENDOR" = "CUSTOMER"): Promise<AuthResponse> {
  const provider = new GoogleAuthProvider();
  try {
    const cred = await signInWithPopup(auth, provider);
    if (cred.user && cred.user.email) {
      const syncRes = await syncFirebaseUserToSupabase({
        uid: cred.user.uid,
        email: cred.user.email,
        name: cred.user.displayName || undefined,
        role: role,
        phone: cred.user.phoneNumber || undefined,
      });

      return {
        success: true,
        user: cred.user,
        dbUser: syncRes.user,
      };
    }
    return { success: false, error: "Google sign-in was cancelled." };
  } catch (err: any) {
    console.error(`[Firebase Auth] Google Sign In error: [${err.code}] ${err.message}`);
    return {
      success: false,
      error: err.code === "auth/popup-closed-by-user" ? "Sign-in cancelled." : err.message || "Failed to sign in with Google.",
    };
  }
}

/**
 * Sends a password reset email using Firebase Auth.
 */
export async function sendPasswordReset(emailInput: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const cleanEmail = emailInput.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { success: false, error: "Please enter a valid email address." };
  }

  try {
    await sendPasswordResetEmail(auth, cleanEmail);
    return {
      success: true,
      message: "Password reset link sent to your email address.",
    };
  } catch (err: any) {
    console.error(`[Firebase Auth] Reset Password error: [${err.code}] ${err.message}`);
    return {
      success: false,
      error: err.code === "auth/user-not-found" ? "No account found with this email." : err.message || "Failed to send reset link.",
    };
  }
}

/**
 * Sign out of Firebase Auth.
 */
export async function signOutUser(): Promise<{ success: boolean }> {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch {
    return { success: false };
  }
}
