
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCv6OCG6H2xh-28p2ozVv0Zen2_SgW9hAY",
  authDomain: "fangyang-hub-9dc7c.firebaseapp.com",
  projectId: "fangyang-hub-9dc7c",
  storageBucket: "fangyang-hub-9dc7c.firebasestorage.app",
  messagingSenderId: "508243052118",
  appId: "1:508243052118:web:a4d4df87711d9901229df7",
  measurementId: "G-2EPQXZRJV9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
