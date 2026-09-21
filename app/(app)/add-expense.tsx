import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function AddExpense() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>TEST MINIMAL</Text>
        <Text style={styles.subtitle}>Si tu vois ça, l'écran marche</Text>
        <Pressable onPress={() => router.back()} style={styles.btn}>
          <Text style={styles.btnText}>Retour</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0E14' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#F5F7FA' },
  subtitle: { fontSize: 14, color: '#8B95A9' },
  btn: { backgroundColor: '#10B981', padding: 16, borderRadius: 12, minWidth: 200, alignItems: 'center' },
  btnText: { color: '#0A0E14', fontWeight: 'bold', fontSize: 16 },
});
