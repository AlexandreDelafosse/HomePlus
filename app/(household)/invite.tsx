import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function InviteScreen() {
  const router = useRouter();
  const { refreshUserProfile } = useAuth();
  const params = useLocalSearchParams();
  
  const inviteCode = (params.inviteCode as string) || 'ABC123';

  const [copied, setCopied] = useState(false);

  const inviteLink = `homeplus://join/${inviteCode}`;

  const handleCopyCode = async () => {
    // Utiliser l'API Clipboard native de React Native
    try {
      // Pour React Native, on peut utiliser l'API Clipboard intégrée
      const Clipboard = await import('@react-native-clipboard/clipboard');
      Clipboard.default.setString(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback : afficher le code dans une alerte
      Alert.alert('Code d\'invitation', inviteCode, [
        { text: 'OK' }
      ]);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Rejoins mon foyer sur HomePlus !\n\nCode d'invitation : ${inviteCode}\n\nOu utilise ce lien : ${inviteLink}`,
        title: 'Invitation HomePlus',
      });
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  const handleContinue = async () => {
    // Rafraîchir le profil pour être sûr que le foyer est bien ajouté
    await refreshUserProfile();
    // Rediriger vers les tabs
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={64} color="#10B981" />
        </View>
        <Text style={styles.title}>Foyer créé !</Text>
        <Text style={styles.subtitle}>
          Invitez maintenant vos colocataires ou membres de la famille
        </Text>
      </View>

      {/* Code Section */}
      <View style={styles.codeSection}>
        <Text style={styles.sectionTitle}>Code d&apos;invitation</Text>
        <View style={styles.codeContainer}>
          <Text style={styles.code}>{inviteCode}</Text>
          <Text style={styles.codeExpiry}>Valable 7 jours</Text>
        </View>

        <TouchableOpacity
          style={styles.copyButton}
          onPress={handleCopyCode}
          activeOpacity={0.8}
        >
          <Ionicons
            name={copied ? 'checkmark' : 'copy-outline'}
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.copyButtonText}>
            {copied ? 'Code copié !' : 'Copier le code'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Share Button */}
      <TouchableOpacity
        style={styles.shareButton}
        onPress={handleShare}
        activeOpacity={0.8}
      >
        <Ionicons name="share-social-outline" size={20} color="#3B82F6" />
        <Text style={styles.shareButtonText}>Partager l&apos;invitation</Text>
      </TouchableOpacity>

      {/* Info */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color="#3B82F6" />
        <Text style={styles.infoText}>
          Partagez le code via WhatsApp, SMS ou email à vos colocataires
        </Text>
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        style={styles.continueButton}
        onPress={handleContinue}
        activeOpacity={0.8}
      >
        <Text style={styles.continueButtonText}>Continuer vers le foyer</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Skip */}
      <TouchableOpacity
        onPress={handleContinue}
        style={styles.skipButton}
      >
        <Text style={styles.skipButtonText}>Je ferai ça plus tard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  successIcon: {
    marginBottom: 16,
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
    textAlign: 'center',
  },
  codeSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  codeContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  code: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3B82F6',
    letterSpacing: 4,
    marginBottom: 8,
  },
  codeExpiry: {
    fontSize: 14,
    color: '#6B7280',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  copyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
    marginBottom: 24,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 32,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 12,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
});