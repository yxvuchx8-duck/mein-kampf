import { useRef, useState } from 'react';
import { ArrowLeft, FolderKanban, FileText, ImagePlus, Newspaper, Plus, Save, Trash2, X } from 'lucide-react';
import { LogBlockEditor } from '@/components/blocks';
import { FloatingHeader, McIcon } from '@/components/Header';
import { compressImage, createBlogPost, createLogBlock, createPage, createProject, findPage, type BlogPost, type Page, type Project, type SyncAction, type WorkspaceState } from '@/data/workspace';

const accentKeys = ['cyan', 'lime', 'amber', 'blue'];
type Space = 'projects' | 'blog';

type Props = {
  state: WorkspaceState;
  setState: (next: WorkspaceState) => void;
  sync: (action: SyncAction) => Promise<boolean>;
  storageError: string;
  clearStorageError: () => void;
  onNavigate: (route: '/' | '/projects' | '/workspace' | '/blog') => void;
};

export function WorkspacePage({ state, setState, sync, storageError, clearStorageError, onNavigate }: Props) {
  const [space, setSpace] = useState<Space>('projects');
  const [message, setMessage] = useState('');
  const [coverBusy, setCoverBusy] = useState(false);
  const coverInput = useRef<HTMLInputElement>(null);
  const project = state.projects.find((p) => p.id === state.activeProjectId);
  const page = findPage(state);
  const post = state.blogPosts.find((p) => p.id === state.activePostId);

  function flash(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 2400);
  }

  function updateProject(id: string, fn: (p: Project) => Project) {
    setState({ ...state, projects: state.projects.map((p) => (p.id === id ? fn(p) : p)) });
  }
  function updatePage(id: string, fn: (pg: Page) => Page) {
    if (!project) return;
    updateProject(project.id, (p) => ({ ...p, pages: p.pages.map((pg) => (pg.id === id ? fn(pg) : pg)) }));
  }
  function updatePost(id: string, fn: (post: BlogPost) => BlogPost) {
    setState({ ...state, blogPosts: state.blogPosts.map((p) => (p.id === id ? fn(p) : p)) });
  }

  async function handleCoverFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !project) return;
    setCoverBusy(true);
    try {
      const coverPhoto = await compressImage(file);
      const next = { ...project, coverPhoto };
      updateProject(project.id, () => next);
      const ok = await sync({ kind: 'save-project', project: next });
      flash(ok ? 'Cover image saved & synced.' : 'Cover set — sync failed, hit it again.');
    } catch {
      flash('Could not read that image file.');
    } finally {
      setCoverBusy(false);
    }
  }

  async function removeCover() {
    if (!project) return;
    const next = { ...project, coverPhoto: '' };
    updateProject(project.id, () => next);
    const ok = await sync({ kind: 'save-project', project: next });
    flash(ok ? 'Cover removed & synced.' : 'Cover removed — sync failed, hit Save & Sync again.');
  }

  function addProject() {
    const p = createProject(`Project ${state.projects.length + 1}`);
    setState({ ...state, projects: [...state.projects, p], activeProjectId: p.id, activePageId: null });
  }
  function removeProject(id: string) {
    const next = state.projects.filter((p) => p.id !== id);
    setState({
      ...state,
      projects: next,
      activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
      activePageId: state.activeProjectId === id ? null : state.activePageId,
    });
    void sync({ kind: 'delete-project', id });
    flash('Project removed.');
  }
  function addPage() {
    if (!project) return;
    const pg = createPage();
    setState({
      ...state,
      projects: state.projects.map((p) => (p.id === project.id ? { ...p, pages: [pg, ...p.pages] } : p)),
      activePageId: pg.id,
    });
  }
  function removePage(id: string) {
    if (!project) return;
    setState({
      ...state,
      projects: state.projects.map((p) => (p.id === project.id ? { ...p, pages: p.pages.filter((pg) => pg.id !== id) } : p)),
      activePageId: state.activePageId === id ? null : state.activePageId,
    });
    void sync({ kind: 'delete-page', id });
    flash('Page removed.');
  }
  function addLogBlock() {
    if (!page) return;
    updatePage(page.id, (pg) => ({ ...pg, updated_at: new Date().toISOString(), blocks: [...pg.blocks, createLogBlock()] }));
  }

  function addPost() {
    const p = createBlogPost();
    setState({ ...state, blogPosts: [p, ...state.blogPosts], activePostId: p.id });
  }
  function removePost(id: string) {
    setState({
      ...state,
      blogPosts: state.blogPosts.filter((p) => p.id !== id),
      activePostId: state.activePostId === id ? null : state.activePostId,
    });
    void sync({ kind: 'delete-post', id });
    flash('Post removed.');
  }
  function addPostBlock() {
    if (!post) return;
    updatePost(post.id, (p) => ({ ...p, blocks: [...p.blocks, createLogBlock()] }));
  }

  const editingBlog = space === 'blog';

  return (
    <main className="min-h-screen bg-[#0d1313] text-[#eef2eb]" data-testid="workspace-page">
      <FloatingHeader
        left={
          <>
            <button data-testid="header-logo-button" onClick={() => onNavigate('/')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#a8b7b7] transition hover:text-white">
              <ArrowLeft size={15} /> Home
            </button>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#c7f36b]">Editing suite</span>
          </>
        }
      />

      <div className="workspace-layout mx-auto max-w-[1400px] px-4 pb-16 pt-28 sm:px-8">
        <aside className="workspace-col" data-testid="project-rail">
          <div className="workspace-col-head">
            <span className="mc-heading">{editingBlog ? 'Blog Space' : 'Projects'}</span>
            {!editingBlog && (
              <button data-testid="add-project-button" onClick={addProject} aria-label="Add project">
                <Plus size={14} />
              </button>
            )}
          </div>
          {editingBlog ? (
            <p className="workspace-empty-hint">
              Blog posts are a flat stream — no project needed. Create and manage them in the middle column, and they publish straight to <span className="text-[#c7f36b]">/blog</span>.
            </p>
          ) : (
            <>
              {state.projects.length === 0 && <p className="workspace-empty-hint">No projects yet. Create one to start documenting.</p>}
              {state.projects.map((p) => (
                <div key={p.id} className={`notebook-item ${p.id === state.activeProjectId ? 'notebook-item-active' : ''}`} data-testid={`project-item-${p.id}`}>
                  <button className="notebook-item-main" onClick={() => setState({ ...state, activeProjectId: p.id, activePageId: null })}>
                    <FolderKanban size={14} className="mc-hide" />
                    <McIcon kind="pickaxe" size={16} className="mc-only" />
                    <span className="truncate">{p.name}</span>
                  </button>
                  <button className="notebook-item-remove" onClick={() => removeProject(p.id)} aria-label={`Remove ${p.name}`} data-testid={`project-remove-${p.id}`}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              {project && (
                <div className="cover-edit" data-testid="cover-edit-panel">
                  {project.coverPhoto && <img src={project.coverPhoto} alt="Current cover" className="cover-edit-preview" data-testid="cover-preview" />}
                  <div className="cover-edit-actions">
                    <button type="button" data-testid="cover-edit-button" onClick={() => coverInput.current?.click()} className="editor-block-add-btn cover-edit-btn" disabled={coverBusy}>
                      <ImagePlus size={13} /> {coverBusy ? 'Compressing…' : project.coverPhoto ? 'Replace cover image' : 'Edit cover image'}
                    </button>
                    {project.coverPhoto && (
                      <button type="button" data-testid="cover-remove-button" onClick={removeCover} className="cover-remove-btn">
                        <Trash2 size={13} /> Remove cover
                      </button>
                    )}
                  </div>
                  <input ref={coverInput} type="file" accept="image/*" className="hidden" data-testid="cover-file-input" onChange={handleCoverFile} />
                </div>
              )}
            </>
          )}
        </aside>

        <aside className="workspace-col" data-testid="page-list">
          <div className="workspace-space-toggle" data-testid="space-toggle">
            <button data-testid="space-projects-tab" onClick={() => setSpace('projects')} className={space === 'projects' ? 'space-tab-active' : ''}>
              <FileText size={13} /> Project Pages
            </button>
            <button data-testid="space-blog-tab" onClick={() => setSpace('blog')} className={space === 'blog' ? 'space-tab-active' : ''}>
              <Newspaper size={13} /> Blog Space
            </button>
          </div>
          {editingBlog ? (
            <>
              <div className="workspace-col-head">
                <span className="mc-heading">Posts</span>
                <button data-testid="add-post-button" onClick={addPost} aria-label="Create new post">
                  <Plus size={14} />
                </button>
              </div>
              {state.blogPosts.length === 0 && <p className="workspace-empty-hint">No posts yet. Create the first one.</p>}
              {state.blogPosts.map((p) => (
                <div key={p.id} className={`notebook-item ${p.id === state.activePostId ? 'notebook-item-active' : ''}`} data-testid={`post-item-${p.id}`}>
                  <button className="notebook-item-main" onClick={() => setState({ ...state, activePostId: p.id })}>
                    <Newspaper size={13} className="mc-hide" />
                    <McIcon kind="sword" size={15} className="mc-only" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{p.title || 'Untitled post'}</span>
                      <span className="text-[10px] text-[#718080]">{new Date(p.datePublished).toLocaleDateString()}</span>
                    </span>
                  </button>
                  <button className="notebook-item-remove" onClick={() => removePost(p.id)} aria-label={`Remove ${p.title}`} data-testid={`post-remove-${p.id}`}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="workspace-col-head">
                <span className="mc-heading">Pages</span>
                {project && (
                  <button data-testid="add-page-button" onClick={addPage} aria-label="Add page">
                    <Plus size={14} />
                  </button>
                )}
              </div>
              {!project && <p className="workspace-empty-hint">Select a project to see its pages.</p>}
              {project && project.pages.length === 0 && <p className="workspace-empty-hint">No pages yet. Add the first one.</p>}
              {project?.pages.map((pg) => (
                <div key={pg.id} className={`notebook-item ${pg.id === page?.id ? 'notebook-item-active' : ''}`} data-testid={`page-item-${pg.id}`}>
                  <button className="notebook-item-main" onClick={() => setState({ ...state, activePageId: pg.id })}>
                    <FileText size={13} className="mc-hide" />
                    <McIcon kind="sword" size={15} className="mc-only" />
                    <span className="truncate">{pg.title || 'Untitled page'}</span>
                  </button>
                  <button className="notebook-item-remove" onClick={() => removePage(pg.id)} aria-label={`Remove ${pg.title}`} data-testid={`page-remove-${pg.id}`}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </>
          )}
        </aside>

        <section className="workspace-editor" data-testid="workspace-editor">
          {editingBlog ? (
            !post ? (
              <div className="workspace-placeholder" data-testid="editor-empty">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#c7f36b]">Blog space</p>
                <h1 className="text-4xl tracking-[-0.05em] sm:text-5xl">
                  Pick a post<span className="text-[#c7f36b]">.</span>
                </h1>
                <p className="mt-4 max-w-sm text-sm leading-6 text-[#879797]">Open or create a post in the middle column. Posts publish straight to the public /blog feed.</p>
              </div>
            ) : (
              <div className="editor-form" data-testid="post-editor-form">
                <input data-testid="post-title-input" className="editor-page-title" value={post.title} onChange={(e) => updatePost(post.id, (p) => ({ ...p, title: e.target.value }))} placeholder="Post title" />
                <p className="mt-3 text-xs text-[#718080]" data-testid="post-date">
                  Published {new Date(post.datePublished).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <div className="editor-blocks">
                  <div className="editor-blocks-head">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#718080]">Post stream</span>
                    <button type="button" data-testid="add-post-block" onClick={addPostBlock} className="editor-block-add-btn">
                      <Plus size={13} /> Add log block
                    </button>
                  </div>
                  {post.blocks.length === 0 && <p className="workspace-empty-hint">No blocks yet — add one and start writing.</p>}
                  {post.blocks.map((block) => (
                    <LogBlockEditor
                      key={block.id}
                      block={block}
                      onChange={(patch) => updatePost(post.id, (p) => ({ ...p, blocks: p.blocks.map((b) => (b.id === block.id ? { ...b, ...patch } : b)) }))}
                      onRemove={() => updatePost(post.id, (p) => ({ ...p, blocks: p.blocks.filter((b) => b.id !== block.id) }))}
                      onStorageError={flash}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    data-testid="post-save-button"
                    type="button"
                    onClick={() =>
                      sync({ kind: 'save-post', post }).then((ok) => {
                        if (ok) flash('Post published & synced to cloud.');
                      })
                    }
                    className="flex items-center gap-2 rounded-full bg-[#c7f36b] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#162016] transition hover:bg-white"
                  >
                    Save &amp; Sync <Save size={14} />
                  </button>
                  <button data-testid="post-close-button" type="button" onClick={() => setState({ ...state, activePostId: null })} className="rounded-full border border-white/10 px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#a8b7b7] transition hover:border-white/30 hover:text-white">
                    <span className="flex items-center gap-2">
                      Close <X size={13} />
                    </span>
                  </button>
                  {message && (
                    <span data-testid="workspace-message" className="mc-toast text-xs text-[#c7f36b]">
                      <McIcon kind="creeper" size={18} className="mc-only" />
                      <span className="mc-toast-title mc-only">Challenge Complete!</span>
                      {message}
                    </span>
                  )}
                </div>
              </div>
            )
          ) : !page || !project ? (
            <div className="workspace-placeholder" data-testid="editor-empty">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#c7f36b]">Secure editing suite</p>
              <h1 className="text-4xl tracking-[-0.05em] sm:text-5xl">
                Pick a page<span className="text-[#c7f36b]">.</span>
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-[#879797]">Choose a project on the left, then open or add a page to start writing. Everything saves to your cloud database.</p>
            </div>
          ) : (
            <div className="editor-form" data-testid="page-editor-form">
              <input data-testid="page-title-input" className="editor-page-title" value={page.title} onChange={(e) => updatePage(page.id, (pg) => ({ ...pg, title: e.target.value }))} placeholder="Untitled page" />
              <div className="grid gap-5 sm:grid-cols-2">
                <label>
                  Project name
                  <input data-testid="project-name-input" value={project.name} onChange={(e) => updateProject(project.id, (p) => ({ ...p, name: e.target.value }))} placeholder="Project name" />
                </label>
                <label>
                  Category
                  <input data-testid="editor-category-input" value={project.category} onChange={(e) => updateProject(project.id, (p) => ({ ...p, category: e.target.value }))} placeholder="Design · 2026" />
                </label>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label>
                  Accent
                  <select data-testid="editor-accent-select" value={project.accent} onChange={(e) => updateProject(project.id, (p) => ({ ...p, accent: e.target.value }))}>
                    {accentKeys.map((key) => (
                      <option key={key} value={key}>
                        {!editingBlog && key}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Project summary
                  <input data-testid="project-summary-input" value={project.summary} onChange={(e) => updateProject(project.id, (p) => ({ ...p, summary: e.target.value }))} placeholder="One line shown on the project square." />
                </label>
              </div>

              <div className="editor-blocks">
                <div className="editor-blocks-head">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#718080]">Log stream</span>
                  <button type="button" data-testid="add-log-block" onClick={addLogBlock} className="editor-block-add-btn">
                    <Plus size={13} /> Add log block
                  </button>
                </div>
                {page.blocks.length === 0 && <p className="workspace-empty-hint">No log blocks yet — add one and start writing. Photos drop straight into a block.</p>}
                {page.blocks.map((block) => (
                  <LogBlockEditor
                    key={block.id}
                    block={block}
                    onChange={(patch) => updatePage(page.id, (pg) => ({ ...pg, updated_at: new Date().toISOString(), blocks: pg.blocks.map((b) => (b.id === block.id ? { ...b, ...patch } : b)) }))}
                    onRemove={() => updatePage(page.id, (pg) => ({ ...pg, blocks: pg.blocks.filter((b) => b.id !== block.id) }))}
                    onStorageError={flash}
                  />
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  data-testid="editor-save-button"
                  type="button"
                  onClick={() =>
                    sync({ kind: 'save-page', project, page }).then((ok) => {
                      if (ok) flash('Page saved & synced to cloud.');
                    })
                  }
                  className="flex items-center gap-2 rounded-full bg-[#c7f36b] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#162016] transition hover:bg-white"
                >
                  Save &amp; Sync <Save size={14} />
                </button>
                <button data-testid="editor-close-button" type="button" onClick={() => setState({ ...state, activePageId: null })} className="rounded-full border border-white/10 px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#a8b7b7] transition hover:border-white/30 hover:text-white">
                  <span className="flex items-center gap-2">
                    Close <X size={13} />
                  </span>
                </button>
                {message && (
                  <span data-testid="workspace-message" className="mc-toast text-xs text-[#c7f36b]">
                    <McIcon kind="creeper" size={18} className="mc-only" />
                    <span className="mc-toast-title mc-only">Challenge Complete!</span>
                    {message}
                  </span>
                )}
              </div>
            </div>
          )}
          {storageError && (
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#f28a6d]/30 bg-[#f28a6d]/10 px-4 py-3 text-xs text-[#f28a6d]" data-testid="storage-error">
              {storageError}
              <button onClick={clearStorageError} aria-label="Dismiss storage warning">
                <X size={14} />
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
