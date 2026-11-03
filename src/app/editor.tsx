import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DrawingCanvas from '@/components/drawing-canvas';
import { loadProjects, type Project } from '@/lib/projects';
import {
  deleteZone,
  loadZones,
  saveZone,
  type Point,
  type Zone,
} from '@/lib/zones';

const BLUE = '#263C4B';
const GREEN = '#31A77B';

type Size = { width: number; height: number };

export default function EditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [zones, setZones] = useState<Zone[]>([]);
  const [points, setPoints] = useState<Point[]>([]);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const pointsRef = useRef<Point[]>([]);
  const strokesRef = useRef<Point[][]>([]);
  const [drawing, setDrawing] = useState(false);
  const [canvas, setCanvas] = useState<Size>({ width: 0, height: 0 });
  const [photo, setPhoto] = useState<Size>({ width: 0, height: 0 });

  const activeStroke = useRef(false);
  const strokeStartIndex = useRef(0);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const projects = await loadProjects();
        const current = projects.find((item) => item.id === id);

        if (!active || !current) return;

        setProject(current);
        setZones(await loadZones(current.id));

        Image.getSize(
          current.photoUri,
          (width, height) => {
            if (active) setPhoto({ width, height });
          },
          () => {
            if (active) {
              Alert.alert('Erreur', 'Impossible de lire la photo.');
            }
          }
        );
      } catch {
        if (active) {
          Alert.alert('Erreur', 'Impossible de charger le chantier.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void initialize();
    return () => { active = false; };
  }, [id]);

  function onCanvasLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setCanvas({ width, height });
  }

  const ready =
    canvas.width > 0 &&
    canvas.height > 0 &&
    photo.width > 0 &&
    photo.height > 0;

  const scale = ready
    ? Math.min(canvas.width / photo.width, canvas.height / photo.height)
    : 0;

  const displayedWidth = photo.width * scale;
  const displayedHeight = photo.height * scale;
  const offsetX = (canvas.width - displayedWidth) / 2;
  const offsetY = (canvas.height - displayedHeight) / 2;

  function toScreen(point: Point): Point {
    return {
      x: offsetX + point.x * displayedWidth,
      y: offsetY + point.y * displayedHeight,
    };
  }

  function toNormalized(x: number, y: number): Point | null {
    if (!ready) return null;

    const nx = (x - offsetX) / displayedWidth;
    const ny = (y - offsetY) / displayedHeight;

    if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return null;

    return { x: nx, y: ny };
  }

  function makePath(zonePoints: Point[], close = false): string {
    if (!zonePoints.length) return '';

    const screenPoints = zonePoints.map(toScreen);
    const first = screenPoints[0];

    const commands = [
      `M ${first.x} ${first.y}`,
      ...screenPoints.slice(1).map((p) => `L ${p.x} ${p.y}`),
    ];

    if (close) commands.push('Z');

    return commands.join(' ');
  }

  function beginStrokePoint(point: Point) {
    if (!drawing || saving) return;

    activeStroke.current = true;
    pointsRef.current = [point];
    setPoints([point]);
  }

  function moveStrokePoint(point: Point) {
    if (!activeStroke.current || !drawing || saving) return;

    const current = pointsRef.current;
    const previous = current[current.length - 1];

    if (previous) {
      const dx = (point.x - previous.x) * photo.width;
      const dy = (point.y - previous.y) * photo.height;
      if (dx * dx + dy * dy < 9) return;
    }

    pointsRef.current = [...current, point];
    setPoints(pointsRef.current);
  }

  function endStroke() {
    if (!activeStroke.current) return;
    activeStroke.current = false;

    const finished = pointsRef.current;
    if (finished.length > 1) {
      strokesRef.current = [...strokesRef.current, finished];
      setStrokes(strokesRef.current);
    }

    pointsRef.current = [];
    setPoints([]);
  }

  function undoStroke() {
    if (saving) return;

    activeStroke.current = false;
    pointsRef.current = [];
    setPoints([]);

    strokesRef.current = strokesRef.current.slice(0, -1);
    setStrokes(strokesRef.current);
  }

  async function finishZone() {
    if (!project || saving) return;

    const completed = [
      ...strokesRef.current,
      ...(pointsRef.current.length > 1 ? [pointsRef.current] : []),
    ].filter((stroke) => stroke.length >= 3);

    if (completed.length === 0) {
      Alert.alert('Aucun contour', 'Dessinez un contour avant de valider.');
      return;
    }

    try {
      setSaving(true);

      const saved: Zone[] = [];
      for (const stroke of completed) {
        saved.push(await saveZone(project.id, stroke));
      }

      setZones((current) => [...current, ...saved]);
      pointsRef.current = [];
      strokesRef.current = [];
      setPoints([]);
      setStrokes([]);
      setDrawing(false);
      activeStroke.current = false;
    } catch {
      Alert.alert('Erreur', "Impossible d'enregistrer tous les contours.");
      if (project) setZones(await loadZones(project.id));
    } finally {
      setSaving(false);
    }
  }

  function removeLastZone() {
    const last = zones[zones.length - 1];
    if (!last || saving) return;

    Alert.alert(
      'Supprimer la zone',
      'Supprimer la dernière zone enregistrée ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              await deleteZone(last.id);
              setZones((current) =>
                current.filter((zone) => zone.id !== last.id)
              );
            } catch {
              Alert.alert('Erreur', 'Suppression impossible.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={BLUE} />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.center}>
        <Text>Projet introuvable.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <View style={styles.projectHeader}>
        <Text style={styles.projectName}>{project.name}</Text>
        <Text style={styles.projectHint}>
          {drawing
            ? 'Dessinez le contour avec votre doigt'
            : `${zones.length} zone(s) enregistrée(s)`}
        </Text>
      </View>

      <DrawingCanvas
        photoUri={project.photoUri}
        photoSize={photo}
        drawing={drawing}
        points={points}
        strokes={strokes}
        zones={zones}
        onStrokeStart={beginStrokePoint}
        onStrokeMove={moveStrokePoint}
        onStrokeEnd={endStroke}
      />

      {drawing ? (
        <View style={styles.actions}>
          <Pressable
            style={styles.secondaryButton}
            disabled={saving || (points.length === 0 && strokes.length === 0)}
            onPress={undoStroke}
          >
            <Text style={styles.secondaryText}>Annuler le trait</Text>
          </Pressable>

          <Pressable
            style={styles.primaryButton}
            disabled={saving || (points.length < 3 && strokes.length === 0)}
            onPress={() => void finishZone()}
          >
            <Text style={styles.primaryText}>
              {saving ? 'Enregistrement...' : 'Fermer la zone'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable
            style={styles.secondaryButton}
            disabled={saving || zones.length === 0}
            onPress={removeLastZone}
          >
            <Text style={styles.secondaryText}>Supprimer une zone</Text>
          </Pressable>

          <Pressable
            style={styles.primaryButton}
            disabled={saving || photo.width <= 0 || photo.height <= 0}
            onPress={() => {
              setPoints([]);
              strokeStartIndex.current = 0;
              setDrawing(true);
            }}
          >
            <Text style={styles.primaryText}>Dessiner une zone</Text>
          </Pressable>
        </View>
      )}

      {drawing && (
        <Pressable
          style={styles.cancelRow}
          onPress={() => {
            setPoints([]);
            setDrawing(false);
            activeStroke.current = false;
          }}
        >
          <Text style={styles.cancelText}>Annuler le dessin</Text>
        </Pressable>
      )}

      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          {drawing
            ? 'Glissez le doigt pour tracer. Fermez la zone une fois le contour terminé.'
            : 'Dessinez directement sur la photo pour délimiter une surface.'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectHeader: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D8DDE0',
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#25333D',
  },
  projectHint: {
    color: '#78848B',
    fontSize: 12,
    marginTop: 4,
  },
  canvas: {
    flex: 1,
    backgroundColor: '#252B30',
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  actions: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD2D7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: BLUE,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelRow: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelText: {
    color: '#8A4444',
    fontSize: 13,
  },
  notice: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#F3F5F6',
  },
  noticeText: {
    color: '#697781',
    fontSize: 12,
    textAlign: 'center',
  },
});
