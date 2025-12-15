
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from "firebase/firestore";
import { WikiArticle } from "../types";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDYEwm_vPBGz7xpreva-YT8lpfD3pjmsH8",
  authDomain: "fangyang-nexus.firebaseapp.com",
  projectId: "fangyang-nexus",
  storageBucket: "fangyang-nexus.firebasestorage.app",
  messagingSenderId: "75823546142",
  appId: "1:75823546142:web:0c59e01bcbdb5f771a530f",
  measurementId: "G-MNXY4XXYHR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// --- Wiki Services ---

const WIKI_COLLECTION = "wiki_articles";

/**
 * Fetch all wiki articles from Firestore
 */
export const getWikiArticles = async (): Promise<WikiArticle[]> => {
  try {
    const q = query(collection(db, WIKI_COLLECTION), orderBy("lastModified", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as WikiArticle));
  } catch (error) {
    console.error("Error fetching wiki articles:", error);
    return [];
  }
};

/**
 * Add a new wiki article
 */
export const addWikiArticle = async (article: Omit<WikiArticle, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, WIKI_COLLECTION), article);
    return docRef.id;
  } catch (error) {
    console.error("Error adding wiki article:", error);
    throw error;
  }
};

/**
 * Update an existing wiki article
 */
export const updateWikiArticle = async (id: string, updates: Partial<WikiArticle>): Promise<void> => {
  try {
    const docRef = doc(db, WIKI_COLLECTION, id);
    // Remove id from updates if it exists to avoid overwriting document key
    const { id: _, ...dataToUpdate } = updates;
    await updateDoc(docRef, dataToUpdate);
  } catch (error) {
    console.error("Error updating wiki article:", error);
    throw error;
  }
};

/**
 * Delete a wiki article
 */
export const deleteWikiArticle = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, WIKI_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting wiki article:", error);
    throw error;
  }
};

export { app, analytics, db };
