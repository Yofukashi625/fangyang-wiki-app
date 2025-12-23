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
import { WikiArticle, School, OnboardingTask, Announcement } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyDYEwm_vPBGz7xpreva-YT8lpfD3pjmsH8",
  authDomain: "fangyang-nexus.firebaseapp.com",
  projectId: "fangyang-nexus",
  storageBucket: "fangyang-nexus.firebasestorage.app",
  messagingSenderId: "75823546142",
  appId: "1:75823546142:web:0c59e01bcbdb5f771a530f",
  measurementId: "G-MNXY4XXYHR"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

const WIKI_COLLECTION = "wiki_articles";
const SCHOOLS_COLLECTION = "schools";
const ONBOARDING_COLLECTION = "onboarding_tasks";
const ANNOUNCEMENTS_COLLECTION = "announcements";

// --- Announcement Services ---

export const getAnnouncements = async (): Promise<Announcement[]> => {
  try {
    const q = query(collection(db, ANNOUNCEMENTS_COLLECTION), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Announcement));
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return [];
  }
};

export const addAnnouncement = async (announcement: Omit<Announcement, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, ANNOUNCEMENTS_COLLECTION), announcement);
    return docRef.id;
  } catch (error) {
    console.error("Error adding announcement:", error);
    throw error;
  }
};

export const updateAnnouncement = async (id: string, updates: Partial<Announcement>): Promise<void> => {
  try {
    const docRef = doc(db, ANNOUNCEMENTS_COLLECTION, id);
    const { id: _, ...dataToUpdate } = updates;
    await updateDoc(docRef, dataToUpdate);
  } catch (error) {
    console.error("Error updating announcement:", error);
    throw error;
  }
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, ANNOUNCEMENTS_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting announcement:", error);
    throw error;
  }
};

// --- Wiki Services ---

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

export const addWikiArticle = async (article: Omit<WikiArticle, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, WIKI_COLLECTION), article);
    return docRef.id;
  } catch (error) {
    console.error("Error adding wiki article:", error);
    throw error;
  }
};

export const updateWikiArticle = async (id: string, updates: Partial<WikiArticle>): Promise<void> => {
  try {
    const docRef = doc(db, WIKI_COLLECTION, id);
    const { id: _, ...dataToUpdate } = updates;
    await updateDoc(docRef, dataToUpdate);
  } catch (error) {
    console.error("Error updating wiki article:", error);
    throw error;
  }
};

export const deleteWikiArticle = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, WIKI_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting wiki article:", error);
    throw error;
  }
};

// --- School Services ---

export const getSchools = async (): Promise<School[]> => {
  try {
    const q = query(collection(db, SCHOOLS_COLLECTION), orderBy("updatedAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as School));
  } catch (error) {
    console.error("Error fetching schools:", error);
    return [];
  }
};

export const addSchool = async (school: Omit<School, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, SCHOOLS_COLLECTION), school);
    return docRef.id;
  } catch (error) {
    console.error("Error adding school:", error);
    throw error;
  }
};

export const updateSchool = async (id: string, updates: Partial<School>): Promise<void> => {
  try {
    const docRef = doc(db, SCHOOLS_COLLECTION, id);
    const { id: _, ...dataToUpdate } = updates;
    await updateDoc(docRef, dataToUpdate);
  } catch (error) {
    console.error("Error updating school:", error);
    throw error;
  }
};

export const deleteSchool = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, SCHOOLS_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting school:", error);
    throw error;
  }
};

// --- Onboarding Services ---

export const getOnboardingTasks = async (): Promise<OnboardingTask[]> => {
  try {
    const q = query(collection(db, ONBOARDING_COLLECTION), orderBy("day", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as OnboardingTask));
  } catch (error) {
    console.error("Error fetching onboarding tasks:", error);
    return [];
  }
};

export const addOnboardingTask = async (task: Omit<OnboardingTask, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, ONBOARDING_COLLECTION), task);
    return docRef.id;
  } catch (error) {
    console.error("Error adding onboarding task:", error);
    throw error;
  }
};

export const updateOnboardingTask = async (id: string, updates: Partial<OnboardingTask>): Promise<void> => {
  try {
    const docRef = doc(db, ONBOARDING_COLLECTION, id);
    const { id: _, ...dataToUpdate } = updates;
    await updateDoc(docRef, dataToUpdate);
  } catch (error) {
    console.error("Error updating onboarding task:", error);
    throw error;
  }
};

export const deleteOnboardingTask = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, ONBOARDING_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting onboarding task:", error);
    throw error;
  }
};

export { app, analytics, db };
