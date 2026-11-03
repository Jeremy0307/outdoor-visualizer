import { useMemo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import type { Point, Zone } from '@/lib/zones';

type Size = {
  width: number;
  height: number;
};

type Props = {
  photoUri: string;
  photoSize: Size;
  drawing: boolean;
  points: Point[];
  strokes: Point[][];
  zones: Zone[];
  onStrokeStart: (point: Point) => void;
  onStrokeMove: (point: Point) => void;
  onStrokeEnd: () => void;
};

const MAX_ZOOM = 8;

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.max(min, Math.min(max, value));
}

function makePath(points: Point[], close = false) {
  if (!points.length) return '';

  const commands = points.map((point, index) =>
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  );

  if (close) commands.push('Z');

  return commands.join(' ');
}

export default function DrawingCanvas({
  photoUri,
  photoSize,
  drawing,
  points,
  strokes,
  zones,
  onStrokeStart,
  onStrokeMove,
  onStrokeEnd,
}: Props) {
  const [viewport, setViewport] = useState<Size>({
    width: 0,
    height: 0,
  });

  const zoom = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const startZoom = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const focalStartX = useSharedValue(0);
  const focalStartY = useSharedValue(0);
  const pinchActive = useSharedValue(false);

  const ready =
    viewport.width > 0 &&
    viewport.height > 0 &&
    photoSize.width > 0 &&
    photoSize.height > 0;

  const fitScale = ready
    ? Math.min(
        viewport.width / photoSize.width,
        viewport.height / photoSize.height
      )
    : 0;

  const imageWidth = photoSize.width * fitScale;
  const imageHeight = photoSize.height * fitScale;

  const imageLeft = (viewport.width - imageWidth) / 2;
  const imageTop = (viewport.height - imageHeight) / 2;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: zoom.value },
    ],
  }));

  const drawingGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .maxPointers(1)
        .activateAfterLongPress(0)
        .enabled(drawing && ready)
        .onStart((event) => {
          const x =
            (event.x - viewport.width / 2 - translateX.value) /
              zoom.value +
            viewport.width / 2;

          const y =
            (event.y - viewport.height / 2 - translateY.value) /
              zoom.value +
            viewport.height / 2;

          const nx = (x - imageLeft) / imageWidth;
          const ny = (y - imageTop) / imageHeight;

          runOnJS(onStrokeStart)({
            x: clamp(nx, 0, 1),
            y: clamp(ny, 0, 1),
          });
        })
        .onUpdate((event) => {
          const x =
            (event.x - viewport.width / 2 - translateX.value) /
              zoom.value +
            viewport.width / 2;

          const y =
            (event.y - viewport.height / 2 - translateY.value) /
              zoom.value +
            viewport.height / 2;

          const nx = (x - imageLeft) / imageWidth;
          const ny = (y - imageTop) / imageHeight;

          runOnJS(onStrokeMove)({
            x: clamp(nx, 0, 1),
            y: clamp(ny, 0, 1),
          });
        })
        .onFinalize(() => {
          runOnJS(onStrokeEnd)();
        }),
    [
      drawing,
      ready,
      viewport.width,
      viewport.height,
      imageLeft,
      imageTop,
      imageWidth,
      imageHeight,
      onStrokeStart,
      onStrokeMove,
      onStrokeEnd,
      translateX,
      translateY,
      zoom,
    ]
  );

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .enabled(ready)
        .onStart(() => {
          startZoom.value = zoom.value;
        })
        .onUpdate((event) => {
          zoom.value = clamp(
            startZoom.value * event.scale,
            1,
            MAX_ZOOM
          );

          // Zoom centré : aucun déplacement de la photo.
          translateX.value = 0;
          translateY.value = 0;
        })
        .onFinalize(() => {
          if (zoom.value <= 1.01) {
            zoom.value = 1;
            translateX.value = 0;
            translateY.value = 0;
          }
        }),
    [
      ready,
      startZoom,
      zoom,
      translateX,
      translateY,
    ]
  );

  const resetGesture = Gesture.Tap()
    .numberOfTaps(2)
    .enabled(!drawing)
    .onEnd(() => {
      zoom.value = 1;
      translateX.value = 0;
      translateY.value = 0;
    });

  const gestures = Gesture.Simultaneous(
    drawingGesture,
    pinchGesture,
    resetGesture
  );

  return (
    <View
      style={styles.container}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setViewport({ width, height });
      }}
    >
      {ready && (
        <GestureDetector gesture={gestures}>
          <Animated.View style={styles.gestureArea}>
            <Animated.View
              pointerEvents="none"
              style={[styles.content, animatedStyle]}
            >
              <Image
                source={{ uri: photoUri }}
                resizeMode="contain"
                style={styles.image}
              />

              <Svg
                style={StyleSheet.absoluteFill}
                width={viewport.width}
                height={viewport.height}
                viewBox={`0 0 ${viewport.width} ${viewport.height}`}
              >
                {zones.map((zone) => (
                  <Path
                    key={zone.id}
                    d={makePath(
                      zone.points.map((point) => ({
                        x: imageLeft + point.x * imageWidth,
                        y: imageTop + point.y * imageHeight,
                      })),
                      true
                    )}
                    fill="rgba(49,167,123,0.28)"
                    stroke="#31A77B"
                    strokeWidth={2.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ))}

                {strokes.map((stroke, index) => (
                  <Path
                    key={`stroke-${index}`}
                    d={makePath(
                      stroke.map((point) => ({
                        x: imageLeft + point.x * imageWidth,
                        y: imageTop + point.y * imageHeight,
                      }))
                    )}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth={3.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ))}

                {points.length > 0 && (
                  <Path
                    d={makePath(
                      points.map((point) => ({
                        x: imageLeft + point.x * imageWidth,
                        y: imageTop + point.y * imageHeight,
                      }))
                    )}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth={3.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                )}
              </Svg>
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#252B30',
    overflow: 'hidden',
  },
  gestureArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
