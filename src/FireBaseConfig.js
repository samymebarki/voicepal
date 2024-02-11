// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAnalytics} from 'firebase/analytics';
import {getAuth} from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDXjuaYzcVmJa9ZSLdE4zHGvcizBTKJaug",
  authDomain: "voicepal-608c8.firebaseapp.com",
  projectId: "voicepal-608c8",
  storageBucket: "voicepal-608c8.appspot.com",
  messagingSenderId: "88522020203",
  appId: "1:88522020203:web:703c71da63fcf0820ca82e",
  measurementId: "G-BP878S8HTQ"
};

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const analytics = getAnalytics(FIREBASE_APP);