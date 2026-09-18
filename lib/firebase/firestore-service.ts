import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./client";

export interface FirestoreUser {
  uid: string;
  phoneNumber: string | null;
  name?: string;
  email?: string;
  age?: number | null;
  role: "CUSTOMER" | "VENDOR" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED";
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FirestoreVenue {
  id: string;
  vendorId: string;
  name: string;
  category: string;
  city: string;
  address: string;
  pricePerHour: number;
  featured: boolean;
  status: "ACTIVE" | "PAUSED" | "CLOSED";
}

export interface FirestoreBooking {
  id: string;
  bookingNumber: string;
  userId: string;
  venueId: string;
  resourceId: string;
  date: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED" | "REFUNDED";
  checkInState: "PENDING" | "CHECKED_IN";
  createdAt?: Timestamp;
}

export class FirestoreService {
  /**
   * Sync or create user document in Firestore on phone login
   */
  async syncUser(user: { uid: string; phoneNumber: string | null; name?: string; role?: "CUSTOMER" | "VENDOR" }): Promise<FirestoreUser> {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data() as FirestoreUser;
      return data;
    }

    const newUser: FirestoreUser = {
      uid: user.uid,
      phoneNumber: user.phoneNumber,
      name: user.name || "Guest Customer",
      role: user.role || "CUSTOMER",
      status: "ACTIVE",
    };

    await setDoc(userRef, {
      ...newUser,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return newUser;
  }

  /**
   * Update user document in Firestore
   */
  async updateUser(uid: string, data: Partial<FirestoreUser>): Promise<void> {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Fetch user by UID
   */
  async getUser(uid: string): Promise<FirestoreUser | null> {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    return snap.exists() ? (snap.data() as FirestoreUser) : null;
  }

  /**
   * Fetch customer bookings from Firestore
   */
  async getUserBookings(userId: string): Promise<FirestoreBooking[]> {
    const q = query(collection(db, "bookings"), where("userId", "==", userId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  }

  /**
   * Fetch venues by city from Firestore
   */
  async getVenues(city?: string): Promise<FirestoreVenue[]> {
    let q = query(collection(db, "venues"), where("status", "==", "ACTIVE"));
    if (city) {
      q = query(collection(db, "venues"), where("city", "==", city), where("status", "==", "ACTIVE"));
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  }
}

export const firestoreService = new FirestoreService();
