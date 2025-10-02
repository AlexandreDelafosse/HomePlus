import * as Crypto from 'expo-crypto';
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase.config';

export type HouseholdType = 'colocation' | 'couple' | 'famille' | 'autre';

/**
 * Modèle de foyer
 */
export interface Household {
  id: string;
  name: string;
  type: HouseholdType;
  createdBy: string;
  createdAt: Date;
  inviteCode: string;
  inviteCodeExpiry?: Date;
  members: {
    [userId: string]: {
      role: 'admin' | 'member' | 'child';
      joinedAt: Date;
      status: 'active' | 'inactive';
    };
  };
  settings: {
    maxMembers: number;
    modules: string[];
  };
}

// Fonction utilitaire pour convertir automatiquement les Timestamp Firestore en Date
function convertTimestamps(obj: any): any {
  if (obj instanceof Timestamp) {
    return obj.toDate();
  }
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      obj[key] = convertTimestamps(obj[key]);
    }
  }
  return obj;
}

export const HouseholdService = {
  /**
   * Générer un UUID v4 compatible React Native
   */
  generateUUID(): string {
    return Crypto.randomUUID();
  },

  /**
   * Générer un code d'invitation unique (6 caractères)
   */
  generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sans I, O, 0, 1
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  /**
   * Créer un foyer
   */
  async createHousehold(
    name: string,
    type: HouseholdType,
    userId: string,
    userDisplayName: string
  ): Promise<Household> {
    try {
      const householdId = this.generateUUID(); // ✅ Utilise expo-crypto
      const inviteCode = this.generateInviteCode();

      // Vérifier que le code n'existe pas déjà
      const codeExists = await this.checkInviteCodeExists(inviteCode);
      if (codeExists) {
        return this.createHousehold(name, type, userId, userDisplayName);
      }

      const now = new Date();
      const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

      const household: Household = {
        id: householdId,
        name,
        type,
        createdBy: userId,
        createdAt: now,
        inviteCode,
        inviteCodeExpiry: expiry,
        members: {
          [userId]: {
            role: 'admin',
            joinedAt: now,
            status: 'active'
          }
        },
        settings: {
          maxMembers: 10,
          modules: ['tasks', 'finances', 'chat']
        }
      };

      // Sauvegarder dans Firestore (convertir les Dates en Timestamps)
      await setDoc(doc(db, 'households', householdId), {
        ...household,
        createdAt: Timestamp.fromDate(now),
        inviteCodeExpiry: Timestamp.fromDate(expiry),
        members: {
          [userId]: {
            ...household.members[userId],
            joinedAt: Timestamp.fromDate(now)
          }
        }
      });

      // Ajouter le foyer au profil utilisateur
      await updateDoc(doc(db, 'users', userId), {
        householdIds: arrayUnion(householdId)
      });

      return household;
    } catch (error) {
      console.error('Erreur création foyer:', error);
      throw new Error('Impossible de créer le foyer');
    }
  },

  /**
   * Vérifier si un code d'invitation existe
   */
  async checkInviteCodeExists(code: string): Promise<boolean> {
    const q = query(collection(db, 'households'), where('inviteCode', '==', code));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  },

  /**
   * Rejoindre un foyer via code d'invitation
   */
  async joinHousehold(
    inviteCode: string,
    userId: string,
    userDisplayName: string
  ): Promise<Household> {
    try {
      const q = query(
        collection(db, 'households'),
        where('inviteCode', '==', inviteCode.toUpperCase())
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("Code d'invitation invalide");
      }

      const householdDoc = querySnapshot.docs[0];
      const householdData = householdDoc.data();
      const household = convertTimestamps(householdData) as Household;
      household.id = householdDoc.id;

      if (household.inviteCodeExpiry && household.inviteCodeExpiry < new Date()) {
        throw new Error("Code d'invitation expiré");
      }

      if (household.members[userId]) {
        throw new Error('Vous êtes déjà membre de ce foyer');
      }

      const memberCount = Object.keys(household.members).length;
      if (memberCount >= household.settings.maxMembers) {
        throw new Error('Ce foyer a atteint le nombre maximum de membres');
      }

      const now = new Date();
      await updateDoc(doc(db, 'households', household.id), {
        [`members.${userId}`]: {
          role: 'member',
          joinedAt: Timestamp.fromDate(now),
          status: 'active'
        }
      });

      await updateDoc(doc(db, 'users', userId), {
        householdIds: arrayUnion(household.id)
      });

      return household;
    } catch (error: any) {
      throw new Error(error.message || 'Impossible de rejoindre le foyer');
    }
  },

  /**
   * Récupérer un foyer par ID
   */
  async getHousehold(householdId: string): Promise<Household | null> {
    try {
      const docRef = doc(db, 'households', householdId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = convertTimestamps(docSnap.data());
        return {
          ...data,
          id: docSnap.id
        } as Household;
      }
      return null;
    } catch (error) {
      console.error('Erreur récupération foyer:', error);
      return null;
    }
  },

  /**
   * Régénérer le code d'invitation
   */
  async regenerateInviteCode(householdId: string, userId: string): Promise<string> {
    const household = await this.getHousehold(householdId);

    if (!household) {
      throw new Error('Foyer introuvable');
    }

    if (household.members[userId]?.role !== 'admin') {
      throw new Error('Seuls les admins peuvent régénérer le code');
    }

    const newCode = this.generateInviteCode();
    const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await updateDoc(doc(db, 'households', householdId), {
      inviteCode: newCode,
      inviteCodeExpiry: Timestamp.fromDate(newExpiry)
    });

    return newCode;
  },

  /**
   * Récupérer tous les foyers d'un utilisateur
   */
  async getUserHouseholds(userId: string): Promise<Household[]> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return [];

      const userData = userDoc.data();
      const householdIds = userData.householdIds || [];
      
      if (householdIds.length === 0) return [];

      const households = await Promise.all(
        householdIds.map((id: string) => this.getHousehold(id))
      );

      return households.filter(h => h !== null) as Household[];
    } catch (error) {
      console.error('Erreur récupération foyers utilisateur:', error);
      return [];
    }
  },

  /**
   * Supprimer un membre (admin)
   */
  async removeMember(
    householdId: string, 
    memberIdToRemove: string, 
    adminId: string
  ): Promise<void> {
    try {
      const household = await this.getHousehold(householdId);
      
      if (!household) {
        throw new Error('Foyer introuvable');
      }

      if (household.members[adminId]?.role !== 'admin') {
        throw new Error('Seuls les administrateurs peuvent retirer des membres');
      }

      if (memberIdToRemove === household.createdBy) {
        throw new Error('Impossible de retirer le créateur du foyer');
      }

      await updateDoc(doc(db, 'households', householdId), {
        [`members.${memberIdToRemove}`]: deleteField()
      });

      await updateDoc(doc(db, 'users', memberIdToRemove), {
        householdIds: arrayRemove(householdId)
      });
    } catch (error: any) {
      console.error('Erreur suppression membre:', error);
      throw new Error(error.message || 'Impossible de retirer le membre');
    }
  },

  /**
   * Quitter un foyer
   */
  async leaveHousehold(householdId: string, userId: string): Promise<void> {
    try {
      const household = await this.getHousehold(householdId);
      
      if (!household) {
        throw new Error('Foyer introuvable');
      }

      if (userId === household.createdBy) {
        throw new Error('Le créateur ne peut pas quitter le foyer. Supprimez-le ou transférez la propriété.');
      }

      await updateDoc(doc(db, 'households', householdId), {
        [`members.${userId}`]: deleteField()
      });

      await updateDoc(doc(db, 'users', userId), {
        householdIds: arrayRemove(householdId)
      });
    } catch (error: any) {
      console.error('Erreur quitter foyer:', error);
      throw new Error(error.message || 'Impossible de quitter le foyer');
    }
  },
};