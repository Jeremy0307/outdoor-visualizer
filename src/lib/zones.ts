import * as FileSystem from 'expo-file-system/legacy';

export type Point = {
  x: number;
  y: number;
};

export type Zone = {
  id: string;
  projectId: string;
  points: Point[];
  createdAt: string;
};

const directory = FileSystem.documentDirectory + 'outdoor-projects/';
const database = directory + 'zones.json';

export async function loadZones(projectId: string): Promise<Zone[]> {
  const info = await FileSystem.getInfoAsync(database);

  if (!info.exists) return [];

  const content = await FileSystem.readAsStringAsync(database);
  const zones = JSON.parse(content) as Zone[];

  return zones.filter((zone) => zone.projectId === projectId);
}

export async function saveZone(
  projectId: string,
  points: Point[]
): Promise<Zone> {
  if (points.length < 3) {
    throw new Error('Une zone nécessite au moins trois points.');
  }

  await FileSystem.makeDirectoryAsync(directory, {
    intermediates: true,
  });

  const info = await FileSystem.getInfoAsync(database);
  const zones: Zone[] = info.exists
    ? JSON.parse(await FileSystem.readAsStringAsync(database))
    : [];

  const zone: Zone = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    projectId,
    points,
    createdAt: new Date().toISOString(),
  };

  await FileSystem.writeAsStringAsync(
    database,
    JSON.stringify([...zones, zone])
  );

  return zone;
}

export async function deleteZone(zoneId: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(database);
  if (!info.exists) return;

  const zones = JSON.parse(
    await FileSystem.readAsStringAsync(database)
  ) as Zone[];

  await FileSystem.writeAsStringAsync(
    database,
    JSON.stringify(zones.filter((zone) => zone.id !== zoneId))
  );
}
