import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  limit
} from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyBbQc9bCDYwYuDvgfpVodjXnNqzSSOU1PY",
  authDomain: "attaedu-19056.firebaseapp.com",
  projectId: "attaedu-19056",
  storageBucket: "attaedu-19056.firebasestorage.app",
  messagingSenderId: "70702699423",
  appId: "1:70702699423:web:d594929fb80b9bc5baa3aa",
  measurementId: "G-PLCS0K016C"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

export interface GuestEntry {
  id?: string;
  name: string;
  relation?: string;
  attendance: "attending" | "maybe" | "wishes_only";
  wishes: string;
  avatarColor?: string;
  createdAt: number | any;
}

const COLLECTION_NAME = "graduation_guests";
const LOCAL_STORAGE_KEY = "graduation_guests_cache";

// Helper to get local cache
export const getLocalGuests = (): GuestEntry[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error reading localStorage:", e);
    return [];
  }
};

// Helper to save to local cache
export const saveLocalGuest = (guest: GuestEntry): GuestEntry[] => {
  if (typeof window === "undefined") return [];
  try {
    const existing = getLocalGuests();
    const updated = [guest, ...existing.filter(g => g.id !== guest.id)];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Error writing localStorage:", e);
    return [];
  }
};

// Save guest to Firestore with fallback
export async function addGuestInvitation(data: {
  name: string;
  relation?: string;
  attendance?: "attending" | "maybe" | "wishes_only";
  wishes?: string;
  avatarColor?: string;
}): Promise<{ success: boolean; id: string; source: "firebase" | "local" }> {
  const timestamp = Date.now();
  const guestData: Omit<GuestEntry, "id"> = {
    name: data.name.trim(),
    relation: data.relation || "Bạn bè",
    attendance: data.attendance || "attending",
    wishes: (data.wishes || "").trim(),
    avatarColor: data.avatarColor || "#70a9c8",
    createdAt: timestamp,
  };

  try {
    // Attempt Firestore write
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...guestData,
      serverTime: serverTimestamp()
    });
    
    const newGuest: GuestEntry = {
      ...guestData,
      id: docRef.id,
    };
    saveLocalGuest(newGuest);
    return { success: true, id: docRef.id, source: "firebase" };
  } catch (firestoreError: any) {
    console.warn("Firestore write notice (falling back to local storage):", firestoreError?.message || firestoreError);
    // Create a client-side ID
    const localId = "guest_" + timestamp + "_" + Math.random().toString(36).substring(2, 7);
    const newGuest: GuestEntry = {
      ...guestData,
      id: localId,
    };
    saveLocalGuest(newGuest);
    return { success: true, id: localId, source: "local" };
  }
}

// Subscribe to real-time updates from Firestore
export function subscribeToGuests(callback: (guests: GuestEntry[], isLive: boolean) => void) {
  let unsubscribe: (() => void) | null = null;
  const initialLocal = getLocalGuests();
  if (initialLocal.length > 0) {
    callback(initialLocal, false);
  }

  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("serverTime", "desc"), limit(100));
    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const liveGuests: GuestEntry[] = [];
        snapshot.forEach((doc) => {
          const d = doc.data();
          liveGuests.push({
            id: doc.id,
            name: d.name || "Khách quý",
            relation: d.relation || "Bạn bè",
            attendance: d.attendance || "attending",
            wishes: d.wishes || "",
            avatarColor: d.avatarColor || "#70a9c8",
            createdAt: d.serverTime?.toMillis ? d.serverTime.toMillis() : (d.createdAt || Date.now()),
          });
        });

        // Merge with local items if any haven't synced
        const localItems = getLocalGuests();
        const liveIds = new Set(liveGuests.map(g => g.id));
        const merged = [...liveGuests];
        for (const localItem of localItems) {
          if (localItem.id && !liveIds.has(localItem.id)) {
            merged.push(localItem);
          }
        }
        callback(merged, true);
      },
      (error) => {
        console.warn("Firestore real-time subscription error:", error?.message);
        // Fallback to local
        callback(getLocalGuests(), false);
      }
    );
  } catch (err) {
    console.warn("Failed to attach Firestore listener:", err);
    callback(getLocalGuests(), false);
  }

  return () => {
    if (unsubscribe) unsubscribe();
  };
}
