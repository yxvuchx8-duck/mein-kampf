export type InlineImage = {
  id: string;
  src: string;
};

export type LogBlock = {
  id: string;
  text: string;
  images: InlineImage[];
};

export type Page = {
  id: string;
  title: string;
  updated_at: string;
  blocks: LogBlock[];
};

export type Project = {
  id: string;
  name: string;
  category: string;
  summary: string;
  accent: string;
  created_at: string;
  pages: Page[];
};

export type WorkspaceState = {
  projects: Project[];
  activeProjectId: string | null;
  activePageId: string | null;
};

const STORAGE_KEY = 'gemer.workspace.v2';
const OLD_STORAGE_KEYS = ['gemer.workspace.v1'];

export const uid = () => `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function createLogBlock(text = ''): LogBlock {
  return { id: uid(), text, images: [] };
}

export function createPage(title = 'Untitled page'): Page {
  return { id: uid(), title, updated_at: new Date().toISOString(), blocks: [] };
}

export function createProject(name: string): Project {
  return { id: uid(), name, category: 'Project', summary: '', accent: 'cyan', created_at: new Date().toISOString(), pages: [] };
}

export function loadWorkspace(): WorkspaceState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WorkspaceState;
      if (Array.isArray(parsed.projects)) return parsed;
    }
  } catch {
    // corrupted storage falls through to a fresh state
  }
  return { projects: [], activeProjectId: null, activePageId: null };
}

export function saveWorkspace(state: WorkspaceState): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    for (const key of OLD_STORAGE_KEYS) window.localStorage.removeItem(key);
    return true;
  } catch {
    // quota exceeded — caller surfaces a warning to the user
    return false;
  }
}

export function findPage(state: WorkspaceState): Page | undefined {
  return state.projects.find((p) => p.id === state.activeProjectId)?.pages.find((pg) => pg.id === state.activePageId);
}

export function compressImage(file: File, maxSize = 1100, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('canvas unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('could not read image'));
    };
    img.src = url;
  });
}
