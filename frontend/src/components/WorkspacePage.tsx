import { useState } from 'react';
import { ArrowLeft, FolderKanban, FileText, Plus, Save, Trash2, X } from 'lucide-react';
import { LogBlockEditor } from '@/components/blocks';
import { FloatingHeader } from '@/components/Header';
import { createLogBlock, createPage, createProject, findPage, type Page, type Project, type WorkspaceState } from '@/data/workspace';

const accentKeys = ['cyan', 'lime', 'amber', 'blue'];

export function WorkspacePage({ state, setState, storageError, clearStorageError, onNavigate }: { state: WorkspaceState; setState: (next: WorkspaceState) => void; storageError: string; clearStorageError: () => void; onNavigate: (route: '/' | '/projects' | '/workspace') => void }) {
  const [message, setMessage] = useState('');
  const project = state.projects.find((p) => p.id === state.activeProjectId);
  const page = findPage(state);

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
    flash('Page removed.');
  }
  function addLogBlock() {
    if (!page) return;
    updatePage(page.id, (pg) => ({ ...pg, updated_at: new Date().toISOString(), blocks: [...pg.blocks, createLogBlock()] }));
  }

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
            <span>Projects</span>
            <button data-testid="add-project-button" onClick={addProject} aria-label="Add project">
              <Plus size={14} />
            </button>
          </div>
          {state.projects.length === 0 && <p className="workspace-empty-hint">No projects yet. Create one to start documenting.</p>}
          {state.projects.map((p) => (
            <div key={p.id} className={`notebook-item ${p.id === state.activeProjectId ? 'notebook-item-active' : ''}`} data-testid={`project-item-${p.id}`}>
              <button className="notebook-item-main" onClick={() => setState({ ...state, activeProjectId: p.id, activePageId: null })}>
                <FolderKanban size={14} />
                <span className="truncate">{p.name}</span>
              </button>
              <button className="notebook-item-remove" onClick={() => removeProject(p.id)} aria-label={`Remove ${p.name}`} data-testid={`project-remove-${p.id}`}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </aside>

        <aside className="workspace-col" data-testid="page-list">
          <div className="workspace-col-head">
            <span>Pages</span>
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
                <FileText size={13} />
                <span className="truncate">{pg.title || 'Untitled page'}</span>
              </button>
              <button className="notebook-item-remove" onClick={() => removePage(pg.id)} aria-label={`Remove ${pg.title}`} data-testid={`page-remove-${pg.id}`}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </aside>

        <section className="workspace-editor" data-testid="workspace-editor">
          {!page || !project ? (
            <div className="workspace-placeholder" data-testid="editor-empty">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#c7f36b]">Secure editing suite</p>
              <h1 className="text-4xl tracking-[-0.05em] sm:text-5xl">
                Pick a page<span className="text-[#c7f36b]">.</span>
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-[#879797]">Choose a project on the left, then open or add a page to start writing. Everything saves locally in your browser.</p>
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
                        {key}
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
                <button data-testid="editor-save-button" type="button" onClick={() => flash('Page saved locally.')} className="flex items-center gap-2 rounded-full bg-[#c7f36b] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#162016] transition hover:bg-white">
                  Save page <Save size={14} />
                </button>
                <button data-testid="editor-close-button" type="button" onClick={() => setState({ ...state, activePageId: null })} className="rounded-full border border-white/10 px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#a8b7b7] transition hover:border-white/30 hover:text-white">
                  <span className="flex items-center gap-2">
                    Close <X size={13} />
                  </span>
                </button>
                {message && (
                  <span data-testid="workspace-message" className="text-xs text-[#c7f36b]">
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
