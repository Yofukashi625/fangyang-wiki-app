
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDa0eFiglnaTsJAOsOV7Z16EU60XIAI_l0",
  authDomain: "fangyang-hub-f694a.firebaseapp.com",
  projectId: "fangyang-hub-f694a",
  storageBucket: "fangyang-hub-f694a.firebasestorage.app",
  messagingSenderId: "792043442444",
  appId: "1:792043442444:web:ad378645b28c5f49f53929",
  measurementId: "G-VD6PJDDEHM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
