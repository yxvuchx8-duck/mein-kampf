import { getSupabase } from '@/data/supabase';

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
  coverPhoto: string;
  created_at: string;
  pages: Page[];
};

export type BlogPost = {
  id: string;
  title: string;
  datePublished: string;
  blocks: LogBlock[];
};

export type WorkspaceState = {
  projects: Project[];
  blogPosts: BlogPost[];
  activeProjectId: string | null;
  activePageId: string | null;
  activePostId: string | null;
};

export const uid = () => crypto.randomUUID();

export function createLogBlock(text = ''): LogBlock {
  return { id: uid(), text, images: [] };
}

export function createPage(title = 'Untitled page'): Page {
  return { id: uid(), title, updated_at: new Date().toISOString(), blocks: [] };
}

export function createProject(name: string): Project {
  return { id: uid(), name, category: 'Project', summary: '', accent: 'cyan', coverPhoto: '', created_at: new Date().toISOString(), pages: [] };
}

export function createBlogPost(): BlogPost {
  return { id: uid(), title: '', datePublished: new Date().toISOString(), blocks: [createLogBlock()] };
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

type ProjectRow = { id: string; name: string; category: string | null; summary: string | null; accent: string | null; cover_photo: string | null; created_at: string };
type PageRow = { id: string; project_id: string; title: string; updated_at: string };
type BlockRow = { id: string; page_id: string; type: string; value: { text?: string; images?: InlineImage[] }; position_order: number };
type PostRow = { id: string; title: string; date_published: string; content_blocks: LogBlock[] | null };

export async function loadWorkspaceFromCloud(): Promise<WorkspaceState> {
  const sb = getSupabase();
  const [projectsRes, pagesRes, blocksRes, postsRes] = await Promise.all([
    sb.from('projects').select('*').order('created_at', { ascending: true }),
    sb.from('pages').select('*').order('updated_at', { ascending: false }),
    sb.from('log_blocks').select('*').order('position_order', { ascending: true }),
    sb.from('blog_posts').select('*').order('date_published', { ascending: false }),
  ]);
  const err = projectsRes.error ?? pagesRes.error ?? blocksRes.error ?? postsRes.error;
  if (err) throw new Error(err.message);

  const blocks = (blocksRes.data ?? []) as BlockRow[];
  const pages = (pagesRes.data ?? []) as PageRow[];
  const projects = ((projectsRes.data ?? []) as ProjectRow[]).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category ?? 'Project',
    summary: p.summary ?? '',
    accent: p.accent ?? 'cyan',
    coverPhoto: p.cover_photo ?? '',
    created_at: p.created_at,
    pages: pages
      .filter((pg) => pg.project_id === p.id)
      .map((pg) => ({
        id: pg.id,
        title: pg.title,
        updated_at: pg.updated_at,
        blocks: blocks
          .filter((b) => b.page_id === pg.id)
          .map((b) => ({ id: b.id, text: b.value?.text ?? '', images: Array.isArray(b.value?.images) ? b.value.images : [] })),
      })),
  }));
  const blogPosts = ((postsRes.data ?? []) as PostRow[]).map((p) => ({
    id: p.id,
    title: p.title,
    datePublished: p.date_published,
    blocks: Array.isArray(p.content_blocks) ? p.content_blocks : [],
  }));
  return { projects, blogPosts, activeProjectId: null, activePageId: null, activePostId: null };
}

function throwIf<T extends { error: { message: string } | null }>(res: T): T {
  if (res.error) throw new Error(res.error.message);
  return res;
}

async function cloudSavePage(project: Project, page: Page) {
  const sb = getSupabase();
  throwIf(await sb.from('projects').upsert({ id: project.id, name: project.name, category: project.category, summary: project.summary, accent: project.accent, cover_photo: project.coverPhoto, created_at: project.created_at }));
  throwIf(await sb.from('pages').upsert({ id: page.id, project_id: project.id, title: page.title, updated_at: page.updated_at }));
  throwIf(await sb.from('log_blocks').delete().eq('page_id', page.id));
  if (page.blocks.length > 0) {
    throwIf(await sb.from('log_blocks').insert(page.blocks.map((b, i) => ({ id: b.id, page_id: page.id, type: 'text', value: { text: b.text, images: b.images }, position_order: i }))));
  }
}

async function cloudSavePost(post: BlogPost) {
  throwIf(await getSupabase().from('blog_posts').upsert({ id: post.id, title: post.title, date_published: post.datePublished, content_blocks: post.blocks }));
}

async function cloudDeletePage(id: string) {
  throwIf(await getSupabase().from('pages').delete().eq('id', id));
}
async function cloudDeleteProject(id: string) {
  throwIf(await getSupabase().from('projects').delete().eq('id', id));
}
async function cloudDeletePost(id: string) {
  throwIf(await getSupabase().from('blog_posts').delete().eq('id', id));
}

async function cloudSaveProject(project: Project) {
  throwIf(await getSupabase().from('projects').upsert({ id: project.id, name: project.name, category: project.category, summary: project.summary, accent: project.accent, cover_photo: project.coverPhoto, created_at: project.created_at }));
}

export type SyncAction =
  | { kind: 'save-page'; project: Project; page: Page }
  | { kind: 'save-post'; post: BlogPost }
  | { kind: 'save-project'; project: Project }
  | { kind: 'delete-page'; id: string }
  | { kind: 'delete-project'; id: string }
  | { kind: 'delete-post'; id: string };

export async function syncToCloud(action: SyncAction): Promise<void> {
  if (action.kind === 'save-page') return cloudSavePage(action.project, action.page);
  if (action.kind === 'save-post') return cloudSavePost(action.post);
  if (action.kind === 'save-project') return cloudSaveProject(action.project);
  if (action.kind === 'delete-page') return cloudDeletePage(action.id);
  if (action.kind === 'delete-project') return cloudDeleteProject(action.id);
  return cloudDeletePost(action.id);
}
