"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { auth, database } from "@/firebase/config";
import { ref, onValue, set } from "firebase/database";
import { dummy } from "@/data";

// Initialize Firebase auth instance
// const auth = getAuth(firebase_app);

// Create the authentication context
export const AuthContext = createContext({} as AuthCtxProp);

// Custom hook to access the authentication context
export const useAuthCtx = () => useContext(AuthContext);

interface AuthContextProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthContextProviderProps): JSX.Element {
  // Set up state to track the authenticated user and loading status
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState(dummy);

  useEffect(() => {
    // Subscribe to the authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        setUser(user);
      } else {
        // User is signed out
        setUser(null);
      }
      // Set loading to false once authentication state is determined
      setLoading(false);
    });

    // Unsubscribe from the authentication state changes when the component is unmounted
    return () => unsubscribe();
  }, []);

  // me
  const getData = () => {
    const userBoardData = ref(database, "users/" + user?.uid);
    onValue(userBoardData, (snapshot) => {
      const data = snapshot.val();
      if (data && user) {
        setBoard(data);
        console.log(data);
        if (data.title) document.title = data.title;
      }
    });
  };

  // Provide the authentication context to child components
  return (
    <AuthContext.Provider value={{ user, board, setBoard }}>
      {loading ? <div>Loading...</div> : children}
    </AuthContext.Provider>
  );
}
