import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, ExternalLink, FileText } from 'lucide-react';
import { BlockView } from '@/components/blocks';
import { FloatingHeader } from '@/components/Header';
import { accentClasses } from '@/components/WorkspacePage';
import type { Notebook, SubPage } from '@/data/workspace';

export function ProjectCard({ page, index, onOpen }: { page: SubPage; index: number; onOpen: () => void }) {
  return (
    <motion.article
      data-testid={`project-card-${page.id}`}
      className="project-card group cursor-pointer"
      onClick={onOpen}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={`project-art bg-gradient-to-br ${accentClasses[page.accent] ?? accentClasses.cyan}`}>
        <div className="project-noise" />
        <span className="absolute left-5 top-5 rounded-full border border-white/20 bg-black/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/80">{page.category || 'Project'}</span>
        <span className="project-mark">G</span>
        <div className="project-ring" />
        <div className="absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#111818] text-[#c7f36b] transition group-hover:rotate-45">
          <ArrowUpRight size={18} />
        </div>
      </div>
      <div className="py-5">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl tracking-[-0.04em] text-white">{page.title || 'Untitled page'}</h3>
          {page.project_url && (
            <a
              href={page.project_url}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${page.title}`}
              className="text-[#c7f36b] transition hover:text-white"
              data-testid={`project-link-${page.id}`}
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={16} />
            </a>
          )}
        </div>
        <p className="mt-3 max-w-md text-sm leading-6 text-[#879797]">{page.summary || 'No summary yet — open the page to read the full write-up.'}</p>
      </div>
    </motion.article>
  );
}

export function ProjectsPage({ notebooks, onNavigate }: { notebooks: Notebook[]; onNavigate: (route: '/' | '/projects' | '/workspace') => void }) {
  const [open, setOpen] = useState<{ notebook: Notebook; page: SubPage } | null>(null);

  if (open) {
    const { notebook, page } = open;
    return (
      <main className="min-h-screen bg-[#111818] text-[#eef2eb]" data-testid="project-detail-page">
        <FloatingHeader
          left={
            <button data-testid="detail-back-button" onClick={() => setOpen(null)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#a8b7b7] transition hover:text-white">
              <ArrowLeft size={15} /> All projects
            </button>
          }
          right={<span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#c7f36b]">{notebook.name}</span>}
        />
        <article className="mx-auto max-w-3xl px-6 pb-24 pt-36 sm:px-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-[#c7f36b]">{page.category || 'Project'}</p>
            <h1 className="text-5xl tracking-[-0.06em] sm:text-6xl" data-testid="detail-title">
              {page.title || 'Untitled page'}
              <span className="text-[#c7f36b]">.</span>
            </h1>
            {page.summary && <p className="mt-6 max-w-xl text-base leading-7 text-[#a8b7b7]">{page.summary}</p>}
            {page.project_url && (
              <a data-testid="detail-external-link" href={page.project_url} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#c7f36b]/40 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#c7f36b] transition hover:bg-[#c7f36b] hover:text-[#162016]">
                Visit project <ExternalLink size={14} />
              </a>
            )}
            <div className="detail-blocks mt-12 space-y-8" data-testid="detail-blocks">
              {page.blocks.length === 0 ? (
                <div className="gallery-empty">This page has no content yet.</div>
              ) : (
                page.blocks.map((block) => <BlockView key={block.id} block={block} />)
              )}
            </div>
          </motion.div>
        </article>
      </main>
    );
  }

  const total = notebooks.reduce((sum, nb) => sum + nb.pages.length, 0);

  return (
    <main className="min-h-screen bg-[#111818] text-[#eef2eb]" data-testid="projects-page">
      <FloatingHeader
        left={
          <>
            <button data-testid="header-back-button" onClick={() => onNavigate('/')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#a8b7b7] transition hover:text-white">
              <ArrowLeft size={15} /> Back to home
            </button>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#c7f36b]">Public gallery</span>
          </>
        }
      />
      <section className="mx-auto min-h-screen max-w-7xl px-6 pb-20 pt-36 sm:px-10 lg:px-16">
        <div className="mb-12 flex items-end justify-between border-b border-white/10 pb-6">
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-[#c7f36b]">Public gallery</p>
            <h1 className="text-5xl tracking-[-0.06em] sm:text-7xl">
              Recorded projects<span className="text-[#c7f36b]">.</span>
            </h1>
          </div>
          <span className="hidden text-xs text-[#718080] sm:block" data-testid="projects-count">
            {total.toString().padStart(2, '0')} recorded
          </span>
        </div>
        {total === 0 ? (
          <div className="gallery-empty" data-testid="projects-empty">
            No projects recorded yet — open the workspace and write the first page.
          </div>
        ) : (
          notebooks.map((notebook) =>
            notebook.pages.length === 0 ? null : (
              <section key={notebook.id} className="mb-14" data-testid={`notebook-section-${notebook.id}`}>
                <div className="mb-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.25em] text-[#718080]">
                  <FileText size={13} className="text-[#c7f36b]" />
                  {notebook.name}
                </div>
                <div className="grid gap-6 sm:grid-cols-2" data-testid="projects-grid">
                  {notebook.pages.map((page, index) => (
                    <ProjectCard key={page.id} page={page} index={index} onOpen={() => setOpen({ notebook, page })} />
                  ))}
                </div>
              </section>
            )
          )
        )}
      </section>
    </main>
  );
}
