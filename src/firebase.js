import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";

// Membaca konfigurasi dari file .env.local yang nanti Anda buat
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const isDemoMode = !firebaseConfig.apiKey;

let app, db;

if (!isDemoMode) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

// Karena tidak ada sistem akun pengguna Google lagi, kita satukan ke dalam satu dokumen Database Global
const GLOBAL_TREE_ID = "Silsilah_Utama_Keluarga";
const GLOBAL_ACCOUNTS_ID = "Daftar_Akun_Pengurus";

// Database Functions untuk Silsilah
export const syncTreeToDB = async (treeData) => {
  if (isDemoMode) return;
  try {
    const docRef = doc(db, "familyTrees", GLOBAL_TREE_ID);
    await setDoc(docRef, { treeData }, { merge: true });
    console.log("Data pohon berhasil disimpan ke cloud!");
  } catch (error) {
    console.error("Gagal menyimpan data pohon:", error);
    throw error;
  }
};

export const getTreeFromDB = async () => {
  if (isDemoMode) return null;
  try {
    const docRef = doc(db, "familyTrees", GLOBAL_TREE_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().treeData;
    }
    return null;
  } catch (error) {
    console.error("Gagal mengambil data pohon:", error);
    return null;
  }
};

// Database Functions untuk Akun Username/Password Admin dan Editor
export const syncAccountsToDB = async (accounts) => {
  if (isDemoMode) return;
  try {
    const docRef = doc(db, "familyTrees", GLOBAL_ACCOUNTS_ID);
    await setDoc(docRef, { accounts }, { merge: true });
    console.log("Data akun berhasil dienkripsi dan disimpan!");
  } catch (error) {
    console.error("Gagal menyimpan data akun:", error);
  }
};

export const getAccountsFromDB = async () => {
  if (isDemoMode) return [];
  try {
    const docRef = doc(db, "familyTrees", GLOBAL_ACCOUNTS_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().accounts || [];
    }
    return [];
  } catch (error) {
    console.error("Gagal mengambil data akun:", error);
    return [];
  }
};

export const logActivity = async (type, details, user) => {
  if (isDemoMode) return;
  try {
    const logRef = collection(db, "activity_logs");
    await addDoc(logRef, {
      type,
      details,
      user: user || "System",
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent
    });
    console.log(`Activity Logged: ${type}`);
    
    // Kirim notifikasi email (Simulasi/Pemicu)
    // Untuk email sungguhan di Vercel/Firebase, sebaiknya menggunakan Cloud Functions.
    // Namun untuk sekarang, kita kirim lewat webhook sederhana jika tersedia.
  } catch (error) {
    console.error("Gagal mencatat aktivitas:", error);
  }
};

export { db };
