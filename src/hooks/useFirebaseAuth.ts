import { useState, useEffect, useCallback, useRef } from 'react';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  handleFirestoreError,
  OperationType,
  type User,
} from '../lib/firebase';

const STORAGE_KEY = 'gbu_validated_dates';

interface UserData {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  validatedDates: string[];
  updatedAt?: string;
  createdAt?: string;
}

export function useFirebaseAuth(
  validatedDates: string[],
  setValidatedDates: React.Dispatch<React.SetStateAction<string[]>>
) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const validatedDatesRef = useRef(validatedDates);
  useEffect(() => {
    validatedDatesRef.current = validatedDates;
  }, [validatedDates]);

  // Listen to Auth State changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);

      if (!currentUser) return;

      // When user logs in, fetch or initialize their Firestore document
      const userRef = doc(db, 'users', currentUser.uid);
      try {
        setIsSyncing(true);
        const snapshot = await getDoc(userRef);
        const currentLocal = validatedDatesRef.current;

        if (snapshot.exists()) {
          const data = snapshot.data() as UserData;
          const remoteDates = Array.isArray(data.validatedDates) ? data.validatedDates : [];

          // Merge local and remote dates to never lose data
          const merged = Array.from(new Set([...remoteDates, ...currentLocal])).sort();
          setValidatedDates(merged);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

          // If local had dates not yet in remote, update remote
          if (merged.length > remoteDates.length) {
            await setDoc(
              userRef,
              {
                id: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL,
                validatedDates: merged,
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            );
          }
        } else {
          // Initialize user document with current local dates
          const initialData: UserData = {
            id: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            validatedDates: currentLocal,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await setDoc(userRef, initialData);
        }
      } catch (err) {
        console.error('Erreur de synchronisation Firestore :', err);
        setSyncError('Impossible de synchroniser avec le compte');
      } finally {
        setIsSyncing(false);
      }
    });

    return () => unsubscribe();
  }, [setValidatedDates]);

  // Real-time listener when user is logged in
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserData;
          if (Array.isArray(data.validatedDates)) {
            const sorted = Array.from(new Set(data.validatedDates)).sort();
            const currentStr = JSON.stringify(validatedDatesRef.current);
            const newStr = JSON.stringify(sorted);
            if (currentStr !== newStr) {
              setValidatedDates(sorted);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
            }
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }
    );

    return () => unsubscribe();
  }, [user, setValidatedDates]);

  // Login with Google Popup
  const loginWithGoogle = useCallback(async () => {
    setSyncError(null);
    try {
      setIsSyncing(true);
      await signInWithPopup(auth, googleProvider);
      return true;
    } catch (err) {
      console.error('Erreur lors de la connexion Google :', err);
      setSyncError('Connexion annulée ou impossible.');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      return true;
    } catch (err) {
      console.error('Erreur de déconnexion :', err);
      return false;
    }
  }, []);

  // Sync dates to Firestore (called when a date is toggled)
  const syncDateChangeToCloud = useCallback(
    async (nextDates: string[]) => {
      if (!user) return;
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(
          userRef,
          {
            id: user.uid,
            validatedDates: nextDates,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }
    },
    [user]
  );

  return {
    user,
    isLoading,
    isSyncing,
    syncError,
    loginWithGoogle,
    logout,
    syncDateChangeToCloud,
  };
}
