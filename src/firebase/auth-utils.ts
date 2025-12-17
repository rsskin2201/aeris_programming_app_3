"use server";

import { Auth, User, createUserWithEmailAndPassword } from "firebase/auth";

/**
 * Creates a new user in Firebase Authentication without changing the current user's auth state.
 * This is meant to be called by an authenticated admin.
 * 
 * @param adminAuth The authenticated Auth instance of the administrator.
 * @param email The email for the new user.
 * @param password The password for the new user.
 * @returns The newly created user object.
 */
export async function createFirebaseUser(adminAuth: Auth, email: string, password: string): Promise<User> {
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
