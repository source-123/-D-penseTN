import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';

export async function signUp(email: string, password: string): Promise<FirebaseUser> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}
export async function signIn(email: string, password: string): Promise<FirebaseUser> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}
export async function signOutUser(): Promise<void> { await signOut(auth); }
export function getCurrentUser(): FirebaseUser | null { return auth.currentUser; }
