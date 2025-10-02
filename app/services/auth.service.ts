import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile, // 👈 import ajouté
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { auth, db } from '../config/firebase.config';

// ✅ Export des types
export type HouseholdType = 'colocation' | 'couple' | 'famille' | 'autre';
export type MemberRole = 'admin' | 'member' | 'child';

export interface HouseholdMember {
  role: MemberRole;
  joinedAt: Date;
  status: 'active' | 'inactive';
  displayName?: string;
}

export interface Household {
  id: string;
  name: string;
  type: HouseholdType;
  createdBy: string;
  createdAt: Date;
  inviteCode: string;
  inviteCodeExpiry?: Date;
  members: {
    [userId: string]: HouseholdMember;
  };
  settings: {
    maxMembers: number;
    modules: string[];
  };
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date;
  householdIds: string[];
}

export const AuthService = {
  
  // Inscription
  async register(email: string, password: string, displayName: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName });

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        createdAt: new Date(),
        householdIds: []
      });

      return user;
    } catch (error: any) {
      throw new Error(this.handleAuthError(error.code));
    }
  },

  // Connexion
  async login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      throw new Error(this.handleAuthError(error.code));
    }
  },

  // Déconnexion
  async logout(): Promise<void> {
    await signOut(auth);
  },

  // Réinitialiser le mot de passe
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(this.handleAuthError(error.code));
    }
  },

  // Récupérer le profil utilisateur
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  },

  // Gestion des erreurs Firebase
  handleAuthError(errorCode: string): string {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'Cet email est déjà utilisé';
      case 'auth/invalid-email':
        return 'Email invalide';
      case 'auth/weak-password':
        return 'Mot de passe trop faible (min 6 caractères)';
      case 'auth/user-not-found':
        return 'Utilisateur introuvable';
      case 'auth/wrong-password':
        return 'Mot de passe incorrect';
      case 'auth/missing-email':
        return 'Veuillez entrer un email';
      default:
        return 'Une erreur est survenue';
    }
  }
};
