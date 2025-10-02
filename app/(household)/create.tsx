import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { HouseholdService, HouseholdType } from '../services/household.service';

const HOUSEHOLD_TYPES = [
  {
    value: 'colocation' as HouseholdType,
    label: 'Colocation',
    icon: '👥',
    description: 'Appartement partagé',
  },
  {
    value: 'couple' as HouseholdType,
    label: 'Couple',
    icon: '💑',
    description: 'Vie à deux',
  },
  {
    value: 'famille' as HouseholdType,
    label: 'Famille',
    icon: '👨‍👩‍👧‍👦',
    description: 'Parents et enfants',
  },
  {
    value: 'autre' as HouseholdType,
    label: 'Autre',
    icon: '🏠',
    description: 'Configuration personnalisée',
  },
];

export default function CreateHouseholdScreen() {
  const router = useRouter();
  const { user, userProfile, refreshUserProfile } = useAuth();

  const [householdName, setHouseholdName] = useState('');
  const [householdType, setHouseholdType] = useState<HouseholdType | ''>('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!householdName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour le foyer');
      return;
    }

    if (!householdType) {
      Alert.alert('Erreur', 'Veuillez sélectionner un type de foyer');
      return;
    }

    if (!user || !userProfile) {
      Alert.alert('Erreur', 'Utilisateur non connecté');
      return;
    }

    setLoading(true);
    try {
      console.log('🏠 Création du foyer...', { householdName, householdType });
      
      const household = await HouseholdService.createHousehold(
        householdName,
        householdType,
        user.uid,
        userProfile.displayName
      );

      console.log('✅ Foyer créé:', household.id);

      // Rafraîchir le profil utilisateur pour récupérer le nouveau foyer
      console.log('🔄 Rafraîchissement du profil...');
      await refreshUserProfile();
      console.log('✅ Profil rafraîchi');

      // Rediriger vers la page d'invitation
      router.replace({
        pathname: '/(household)/invite',
        params: { householdId: household.id, inviteCode: household.inviteCode },
      });
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text style={styles.title}>Créer un foyer</Text>
      <Text style={styles.subtitle}>Donnez un nom à votre foyer et choisissez son type</Text>

      {/* Name Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nom du foyer</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Appart Centre-Ville"
          value={householdName}
          onChangeText={setHouseholdName}
          autoCapitalize="words"
        />
      </View>

      {/* Type Selection */}
      <View style={styles.typeContainer}>
        <Text style={styles.label}>Type de foyer</Text>
        <View style={styles.typesGrid}>
          {HOUSEHOLD_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeCard,
                householdType === type.value && styles.typeCardSelected,
              ]}
              onPress={() => setHouseholdType(type.value)}
              activeOpacity={0.7}
            >
              <Text style={styles.typeIcon}>{type.icon}</Text>
              <Text style={styles.typeLabel}>{type.label}</Text>
              <Text style={styles.typeDescription}>{type.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Create Button */}
      <TouchableOpacity
        style={[styles.createButton, loading && styles.createButtonDisabled]}
        onPress={handleCreate}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.createButtonText}>Créer le foyer</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  typeContainer: {
    marginBottom: 32,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  typeCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});