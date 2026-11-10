import { useState } from 'react';
import { ArrowLeft, Code2, FileText, Image, NotebookPen, Plus, Save, Trash2, Video, X } from 'lucide-react';
import { BlockEditor } from '@/components/blocks';
import { FloatingHeader } from '@/components/Header';
import { createBlock, createNotebook, createPage, findPage, uid, type Block, type SubPage, type WorkspaceState } from '@/data/workspace';

const accentClasses: Record<string, string> = {
  cyan: 'from-[#153b42] via-[#236d72] to-[#91e9d3]',
  lime: 'from-[#35451f] via-[#718d36] to-[#d3f36d]',
  amber: 'from-[#4b321d] via-[#a85e38] to-[#f3ba6b]',
  blue: 'from-[#1e334b] via-[#386a9a] to-[#9bd8f0]',
};
const accentKeys = ['cyan', 'lime', 'amber', 'blue'];

const blockButtons: { type: Block['type']; label: string; icon: typeof FileText }[] = [
  { type: 'markdown', label: 'Text', icon: FileText },
  { type: 'image', label: 'Image', icon: Image },
  { type: 'video', label: 'Video', icon: Video },
  { type: 'code', label: 'Code', icon: Code2 },
];

function metaText(text: string) {
  return text.replace(/[#>*`_-]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function WorkspacePage({ state, setState, onNavigate }: { state: WorkspaceState; setState: (next: WorkspaceState) => void; onNavigate: (route: '/' | '/projects' | '/workspace') => void }) {
  const [message, setMessage] = useState('');
  const notebook = state.notebooks.find((nb) => nb.id === state.activeNotebookId);
  const page = findPage(state);
  const activePageId = page?.id;

  function flash(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 2200);
  }

  function updateNotebook(id: string, fn: (nb: (typeof state.notebooks)[number]) => (typeof state.notebooks)[number]) {
    setState({ ...state, notebooks: state.notebooks.map((nb) => (nb.id === id ? fn(nb) : nb)) });
  }
  function updatePage(id: string, fn: (p: SubPage) => SubPage) {
    if (!notebook) return;
    updateNotebook(notebook.id, (nb) => ({ ...nb, pages: nb.pages.map((p) => (p.id === id ? fn(p) : p)) }));
  }

  function addNotebook() {
    const nb = createNotebook(`Notebook ${state.notebooks.length + 1}`);
    setState({ ...state, notebooks: [...state.notebooks, nb], activeNotebookId: nb.id, activePageId: null });
  }
  function removeNotebook(id: string) {
    const next = state.notebooks.filter((nb) => nb.id !== id);
    setState({ ...state, notebooks: next, activeNotebookId: state.activeNotebookId === id ? null : state.activeNotebookId, activePageId: state.activeNotebookId === id ? null : state.activePageId });
    flash('Notebook removed.');
  }
  function addPage() {
    if (!notebook) return;
    const p = createPage();
    updateNotebook(notebook.id, (nb) => ({ ...nb, pages: [p, ...nb.pages] }));
    setState({ ...state, notebooks: state.notebooks.map((nb) => (nb.id === notebook.id ? { ...nb, pages: [p, ...nb.pages] } : nb)), activePageId: p.id });
  }
  function removePage(id: string) {
    if (!notebook) return;
    updateNotebook(notebook.id, (nb) => ({ ...nb, pages: nb.pages.filter((p) => p.id !== id) }));
    if (activePageId === id) setState({ ...state, notebooks: state.notebooks.map((nb) => (nb.id === notebook.id ? { ...nb, pages: nb.pages.filter((p) => p.id !== id) } : nb)), activePageId: null });
    flash('Page removed.');
  }
  function addBlock(type: Block['type']) {
    if (!activePageId) return;
    updatePage(activePageId, (p) => ({ ...p, updated_at: new Date().toISOString(), blocks: [...p.blocks, createBlock(type)] }));
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
        <aside className="workspace-col" data-testid="notebook-rail">
          <div className="workspace-col-head">
            <span>Notebooks</span>
            <button data-testid="add-notebook-button" onClick={addNotebook} aria-label="Add notebook">
              <Plus size={14} />
            </button>
          </div>
          {state.notebooks.length === 0 && <p className="workspace-empty-hint">No notebooks yet. Create one to start documenting.</p>}
          {state.notebooks.map((nb) => (
            <div key={nb.id} className={`notebook-item ${nb.id === state.activeNotebookId ? 'notebook-item-active' : ''}`} data-testid={`notebook-item-${nb.id}`}>
              <button className="notebook-item-main" onClick={() => setState({ ...state, activeNotebookId: nb.id, activePageId: null })}>
                <NotebookPen size={14} />
                <span className="truncate">{nb.name}</span>
              </button>
              <button className="notebook-item-remove" onClick={() => removeNotebook(nb.id)} aria-label={`Remove ${nb.name}`} data-testid={`notebook-remove-${nb.id}`}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </aside>

        <aside className="workspace-col" data-testid="page-list">
          <div className="workspace-col-head">
            <span>Pages</span>
            {notebook && (
              <button data-testid="add-page-button" onClick={addPage} aria-label="Add page">
                <Plus size={14} />
              </button>
            )}
          </div>
          {!notebook && <p className="workspace-empty-hint">Select a notebook to see its pages.</p>}
          {notebook && notebook.pages.length === 0 && <p className="workspace-empty-hint">No pages yet. Add the first one.</p>}
          {notebook?.pages.map((p) => (
            <div key={p.id} className={`notebook-item ${p.id === activePageId ? 'notebook-item-active' : ''}`} data-testid={`page-item-${p.id}`}>
              <button className="notebook-item-main" onClick={() => setState({ ...state, activePageId: p.id })}>
                <FileText size={13} />
                <span className="truncate">{p.title || 'Untitled page'}</span>
              </button>
              <button className="notebook-item-remove" onClick={() => removePage(p.id)} aria-label={`Remove ${p.title}`} data-testid={`page-remove-${p.id}`}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </aside>

        <section className="workspace-editor" data-testid="workspace-editor">
          {!page ? (
            <div className="workspace-placeholder" data-testid="editor-empty">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#c7f36b]">Secure editing suite</p>
              <h1 className="text-4xl tracking-[-0.05em] sm:text-5xl">
                Pick a page<span className="text-[#c7f36b]">.</span>
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-[#879797]">Choose a notebook on the left, then open or add a page to start writing. Everything saves locally in your browser.</p>
            </div>
          ) : (
            <div className="editor-form" data-testid="page-editor-form">
              <input data-testid="page-title-input" className="editor-page-title" value={page.title} onChange={(e) => updatePage(page.id, (p) => ({ ...p, title: e.target.value }))} placeholder="Untitled page" />
              <div className="grid gap-5 sm:grid-cols-2">
                <label>
                  Category
                  <input data-testid="editor-category-input" value={page.category} onChange={(e) => updatePage(page.id, (p) => ({ ...p, category: e.target.value }))} placeholder="Design · 2026" />
                </label>
                <label>
                  Accent
                  <select data-testid="editor-accent-select" value={page.accent} onChange={(e) => updatePage(page.id, (p) => ({ ...p, accent: e.target.value }))}>
                    {accentKeys.map((key) => (
                      <option key={key} value={key}>
                        {key}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Summary
                <textarea data-testid="editor-summary-input" rows={2} value={page.summary} onChange={(e) => updatePage(page.id, (p) => ({ ...p, summary: e.target.value }))} placeholder="One or two lines shown on the gallery card." />
              </label>
              <label>
                External link <span className="font-normal text-[#718080]">(optional)</span>
                <input data-testid="editor-url-input" value={page.project_url} onChange={(e) => updatePage(page.id, (p) => ({ ...p, project_url: e.target.value }))} placeholder="https://" />
              </label>

              <div className="editor-blocks">
                <div className="editor-blocks-head">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#718080]">Content blocks</span>
                  <div className="editor-block-add">
                    {blockButtons.map(({ type, label, icon: Icon }) => (
                      <button key={type} type="button" data-testid={`add-block-${type}`} onClick={() => addBlock(type)} className="editor-block-add-btn">
                        <Icon size={13} /> {label}
                      </button>
                    ))}
                  </div>
                </div>
                {page.blocks.length === 0 && <p className="workspace-empty-hint">No blocks yet — add text, images, videos or code.</p>}
                {page.blocks.map((block) => (
                  <BlockEditor
                    key={block.id}
                    block={block}
                    onChange={(patch) => updatePage(page.id, (p) => ({ ...p, updated_at: new Date().toISOString(), blocks: p.blocks.map((b) => (b.id === block.id ? { ...b, ...patch } : b)) }))}
                    onRemove={() => updatePage(page.id, (p) => ({ ...p, blocks: p.blocks.filter((b) => b.id !== block.id) }))}
                  />
                ))}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button data-testid="editor-save-button" type="button" onClick={() => flash('Page saved.')} className="flex items-center gap-2 rounded-full bg-[#c7f36b] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#162016] transition hover:bg-white">
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
        </section>
      </div>
      <span className="hidden" data-testid="workspace-state-probe" data-page-id={activePageId ?? ''} data-meta={page ? metaText(page.blocks.find((b) => b.type === 'markdown')?.text ?? '') : ''} data-accent={page?.accent ?? ''} data-uid={uid()} />
    </main>
  );
}

export { accentClasses };
