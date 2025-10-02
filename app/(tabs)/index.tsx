import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Household, HouseholdService } from '../services/household.service';

export default function HomeScreen() {
  const router = useRouter();
  const { user, userProfile, logout } = useAuth();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHouseholds = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userHouseholds = await HouseholdService.getUserHouseholds(user.uid);
      setHouseholds(userHouseholds);
    } catch (error) {
      console.error('Erreur chargement foyers:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadHouseholds();
  }, [loadHouseholds]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  const handleInvite = (household: Household) => {
    router.push({
      pathname: '/(household)/invite',
      params: { 
        householdId: household.id, 
        inviteCode: household.inviteCode 
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.name}>{userProfile?.displayName || 'Utilisateur'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Foyers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mes foyers</Text>
        {households.map((household) => (
          <View key={household.id} style={styles.householdCard}>
            <View style={styles.householdHeader}>
              <View>
                <Text style={styles.householdName}>{household.name}</Text>
                <Text style={styles.householdType}>
                  {household.type === 'colocation' ? '👥 Colocation' : 
                   household.type === 'couple' ? '💑 Couple' :
                   household.type === 'famille' ? '👨‍👩‍👧‍👦 Famille' : '🏠 Autre'}
                </Text>
              </View>
              <View style={styles.householdBadge}>
                <Text style={styles.householdBadgeText}>
                  {Object.keys(household.members).length} {Object.keys(household.members).length > 1 ? 'membres' : 'membre'}
                </Text>
              </View>
            </View>

            {/* Bouton Inviter */}
            <TouchableOpacity
              style={styles.inviteButton}
              onPress={() => handleInvite(household)}
              activeOpacity={0.7}
            >
              <Ionicons name="person-add" size={18} color="#3B82F6" />
              <Text style={styles.inviteButtonText}>Inviter des membres</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="checkmark-circle" size={32} color="#3B82F6" />
            <Text style={styles.actionText}>Tâches</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="wallet" size={32} color="#10B981" />
            <Text style={styles.actionText}>Finances</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="calendar" size={32} color="#F59E0B" />
            <Text style={styles.actionText}>Agenda</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="chatbubbles" size={32} color="#8B5CF6" />
            <Text style={styles.actionText}>Messages</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  logoutButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 24,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  householdCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  householdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  householdName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  householdType: {
    fontSize: 14,
    color: '#6B7280',
  },
  householdBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  householdBadgeText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  inviteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
});