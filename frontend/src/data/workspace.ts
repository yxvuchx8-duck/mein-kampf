export type Block = {
  id: string;
  type: 'markdown' | 'image' | 'video' | 'code';
  text: string;
  language: string;
};

export type SubPage = {
  id: string;
  title: string;
  category: string;
  summary: string;
  project_url: string;
  accent: string;
  updated_at: string;
  blocks: Block[];
};

export type Notebook = {
  id: string;
  name: string;
  created_at: string;
  pages: SubPage[];
};

export type WorkspaceState = {
  notebooks: Notebook[];
  activeNotebookId: string | null;
  activePageId: string | null;
};

const STORAGE_KEY = 'gemer.workspace.v1';

export const uid = () => `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function createBlock(type: Block['type'] = 'markdown', text = '', language = 'javascript'): Block {
  return { id: uid(), type, text, language };
}

export function createPage(title = 'Untitled page'): SubPage {
  return { id: uid(), title, category: 'Project', summary: '', project_url: '', accent: 'cyan', updated_at: new Date().toISOString(), blocks: [createBlock()] };
}

export function createNotebook(name: string): Notebook {
  return { id: uid(), name, created_at: new Date().toISOString(), pages: [] };
}

export function loadWorkspace(): WorkspaceState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WorkspaceState;
      if (Array.isArray(parsed.notebooks)) return parsed;
    }
  } catch {
    // corrupted storage falls through to a fresh state
  }
  return { notebooks: [], activeNotebookId: null, activePageId: null };
}

export function saveWorkspace(state: WorkspaceState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function findPage(state: WorkspaceState): SubPage | undefined {
  return state.notebooks.find((nb) => nb.id === state.activeNotebookId)?.pages.find((p) => p.id === state.activePageId);
}
