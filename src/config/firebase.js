import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDl4vlfuFyS59QjcTObU6tMZbGDNelCvHI",
    authDomain: "secret-h-companion.firebaseapp.com",
    projectId: "secret-h-companion",
    storageBucket: "secret-h-companion.appspot.com",
    messagingSenderId: "252090771005",
    appId: "1:252090771005:web:40e7d156b1f81c29566c54"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);