import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  createProject,
  loadProjects,
  type Project,
} from '@/lib/projects';

const BLUE = '#263C4B';

export default function ProjectsScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setProjects(await loadProjects());
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les projets.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  async function addProject(camera: boolean) {
    if (busy) return;

    try {
      setBusy(true);

      if (camera) {
        const permission =
          await ImagePicker.requestCameraPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            'Caméra',
            "Autorise l'accès à la caméra dans les réglages."
          );
          return;
        }
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        quality: 1,
        allowsEditing: false,
      };

      const result = camera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (result.canceled || !result.assets.length) return;

      const project = await createProject(result.assets[0].uri);
      await refresh();

      router.push({
        pathname: '/editor',
        params: { id: project.id },
      });
    } catch {
      Alert.alert(
        'Erreur',
        "Impossible de créer le projet à partir de cette photo."
      );
    } finally {
      setBusy(false);
    }
  }

  function chooseSource() {
    Alert.alert('Nouveau projet', 'Ajouter une photo de chantier', [
      { text: 'Prendre une photo', onPress: () => void addProject(true) },
      {
        text: 'Choisir dans la galerie',
        onPress: () => void addProject(false),
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>Outdoor Visualizer</Text>
          <Text style={styles.heading}>Mes projets</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ajouter un projet"
          disabled={busy}
          onPress={chooseSource}
          style={styles.addButton}
        >
          <Text style={styles.addSymbol}>+</Text>
        </Pressable>
      </View>

      {busy && <ActivityIndicator color={BLUE} />}

      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          projects.length === 0 && styles.emptyList,
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Aucun projet</Text>
            <Text style={styles.emptyText}>
              Ajoutez une photo pour commencer votre premier chantier.
            </Text>
            <Pressable
              style={styles.emptyButton}
              onPress={chooseSource}
              disabled={busy}
            >
              <Text style={styles.emptyButtonText}>
                Créer un projet
              </Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/editor',
                params: { id: item.id },
              })
            }
            style={styles.projectRow}
          >
            <Image
              source={{ uri: item.photoUri }}
              style={styles.thumbnail}
            />
            <View style={styles.projectInfo}>
              <Text style={styles.projectName}>{item.name}</Text>
              <Text style={styles.projectDate}>
                {new Date(item.createdAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F6F7' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D7DCE0',
  },
  appName: {
    color: '#667681',
    fontSize: 13,
    marginBottom: 5,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#202C34',
  },
  addButton: {
    backgroundColor: BLUE,
    width: 46,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSymbol: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '300',
    marginTop: -3,
  },
  list: { padding: 16 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  empty: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 70,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#26343D',
    marginBottom: 10,
  },
  emptyText: {
    color: '#65727B',
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: BLUE,
    borderRadius: 9,
    paddingHorizontal: 24,
    paddingVertical: 15,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  projectRow: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E5E8',
  },
  thumbnail: {
    width: 76,
    height: 70,
    borderRadius: 6,
    backgroundColor: '#E5E8EA',
  },
  projectInfo: { flex: 1, marginLeft: 14 },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#26343D',
  },
  projectDate: {
    fontSize: 13,
    color: '#78848C',
    marginTop: 6,
  },
  chevron: {
    fontSize: 28,
    color: '#8A969E',
    paddingHorizontal: 6,
  },
});
