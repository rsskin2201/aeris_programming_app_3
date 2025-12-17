'use server';

import { Auth, User as AuthUser, createUserWithEmailAndPassword } from "firebase/auth";
import { Firestore, doc, setDoc } from "firebase/firestore";
import { User } from "@/lib/types";

/**
 * Creates a new user in Firebase Authentication without changing the current user's auth state.
 * This is meant to be called by an authenticated admin.
 * 
 * @param adminAuth The authenticated Auth instance of the administrator.
 * @param email The email for the new user.
 * @param password The password for the new user.
 * @returns The newly created user object.
 */
export async function createFirebaseUser(adminAuth: Auth, email: string, password: string): Promise<AuthUser> {
  try {
    // By using the admin's auth instance, Firebase knows not to sign in the new user.
    const userCredential = await createUserWithEmailAndPassword(adminAuth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error creating Firebase user:", error);
    // Re-throw the error so the calling function can handle it.
    throw error;
  }
}

/**
 * Adds multiple users to Firebase Auth and Firestore.
 * This function is designed to be called from a server-side context or a secure client-side handler.
 * It ensures the admin's session remains active throughout the process.
 * 
 * @param auth The Firebase Auth instance.
 * @param firestore The Firestore instance.
 * @param users An array of user objects to create.
 */
export async function addMultipleUsers(
  auth: Auth,
  firestore: Firestore,
  users: (Omit<User, 'id'> & { password?: string })[]
): Promise<void> {
  if (!auth.currentUser) {
    throw new Error("El administrador debe estar autenticado para realizar esta operación.");
  }
  
  for (const newUser of users) {
    const email = `${newUser.username}@aeris.com`;
    if (!newUser.password) {
      console.warn("Omitiendo usuario por falta de contraseña:", newUser.username);
      continue;
    }

    try {
      // 1. Create the new user.
      const userCredential = await createFirebaseUser(auth, email, newUser.password);
      
      // 2. If creation is successful, save their profile to Firestore.
      const userProfile: User = {
        id: userCredential.user.uid,
        name: newUser.name,
        username: newUser.username,
        role: newUser.role,
        zone: newUser.zone,
        status: newUser.status,
      };
      await setDoc(doc(firestore, 'users', userCredential.user.uid), userProfile);

    } catch (error: any) {
      console.error(`Error al crear el usuario ${newUser.username}:`, error);
      // Re-throw to stop the process and alert the calling function
      throw new Error(`Falló la creación del usuario ${newUser.username}: ${error.message}`);
    }
  }
}
