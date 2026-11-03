import * as FileSystem from 'expo-file-system/legacy';

export type Project = {
  id: string;
  name: string;
  photoUri: string;
  createdAt: string;
};

const directory = FileSystem.documentDirectory + 'outdoor-projects/';
const database = directory + 'projects.json';

async function ensureDirectory() {
  await FileSystem.makeDirectoryAsync(directory, {
    intermediates: true,
  });
}

export async function loadProjects(): Promise<Project[]> {
  await ensureDirectory();

  const info = await FileSystem.getInfoAsync(database);
  if (!info.exists) return [];

  const content = await FileSystem.readAsStringAsync(database);
  return JSON.parse(content) as Project[];
}

export async function createProject(
  sourceUri: string
): Promise<Project> {
  await ensureDirectory();

  const projects = await loadProjects();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const extension =
    sourceUri.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg';

  const safeExtension = ['jpg', 'jpeg', 'png', 'heic', 'webp']
    .includes(extension) ? extension : 'jpg';

  const photoUri = `${directory}${id}.${safeExtension}`;

  await FileSystem.copyAsync({
    from: sourceUri,
    to: photoUri,
  });

  const project: Project = {
    id,
    name: `Chantier ${projects.length + 1}`,
    photoUri,
    createdAt: new Date().toISOString(),
  };

  try {
    await FileSystem.writeAsStringAsync(
      database,
      JSON.stringify([project, ...projects])
    );
  } catch (error) {
    await FileSystem.deleteAsync(photoUri, { idempotent: true });
    throw error;
  }

  return project;
}
