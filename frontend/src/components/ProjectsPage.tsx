import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, FileText } from 'lucide-react';
import { LogBlockView } from '@/components/blocks';
import { FloatingHeader } from '@/components/Header';
import type { Page, Project } from '@/data/workspace';

const accentClasses: Record<string, string> = {
  cyan: 'from-[#153b42] via-[#236d72] to-[#91e9d3]',
  lime: 'from-[#35451f] via-[#718d36] to-[#d3f36d]',
  amber: 'from-[#4b321d] via-[#a85e38] to-[#f3ba6b]',
  blue: 'from-[#1e334b] via-[#386a9a] to-[#9bd8f0]',
};

type Drill = { project: Project; page: Page | null } | null;

function ProjectSquare({ project, index, onOpen }: { project: Project; index: number; onOpen: () => void }) {
  return (
    <motion.button
      data-testid={`project-square-${project.id}`}
      className="project-card group text-left"
      onClick={onOpen}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={`project-art bg-gradient-to-br ${accentClasses[project.accent] ?? accentClasses.cyan}`}>
        <div className="project-noise" />
        <span className="absolute left-5 top-5 rounded-full border border-white/20 bg-black/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/80">{project.category || 'Project'}</span>
        <span className="project-mark">G</span>
        <div className="project-ring" />
        <div className="absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#111818] text-[#c7f36b] transition group-hover:rotate-45">
          <ArrowUpRight size={18} />
        </div>
      </div>
      <div className="py-5">
        <h3 className="text-2xl tracking-[-0.04em] text-white">{project.name}</h3>
        <p className="mt-3 max-w-md text-sm leading-6 text-[#879797]">{project.summary || `${project.pages.length} ${project.pages.length === 1 ? 'page' : 'pages'} inside.`}</p>
      </div>
    </motion.button>
  );
}

function PageIndexView({ project, onBack, onOpenPage }: { project: Project; onBack: () => void; onOpenPage: (page: Page) => void }) {
  return (
    <>
      <FloatingHeader
        left={
          <button data-testid="index-back-button" onClick={onBack} className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#a8b7b7] transition hover:text-white">
            <ArrowLeft size={15} /> All projects
          </button>
        }
        right={<span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#c7f36b]">{project.category || 'Project'}</span>}
      />
      <section className="mx-auto max-w-3xl px-6 pb-24 pt-36 sm:px-10" data-testid="page-index-view">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-[#c7f36b]">Table of contents</p>
          <h1 className="text-5xl tracking-[-0.06em] sm:text-6xl" data-testid="index-title">
            {project.name}
            <span className="text-[#c7f36b]">.</span>
          </h1>
          {project.summary && <p className="mt-6 max-w-xl text-base leading-7 text-[#a8b7b7]">{project.summary}</p>}
          <div className="mt-12 space-y-3" data-testid="page-index-list">
            {project.pages.length === 0 ? (
              <div className="gallery-empty">This project has no pages yet.</div>
            ) : (
              project.pages.map((page, index) => (
                <button key={page.id} data-testid={`index-page-${page.id}`} onClick={() => onOpenPage(page)} className="index-page-row group">
                  <span className="index-page-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="index-page-body">
                    <span className="index-page-title">{page.title || 'Untitled page'}</span>
                    <span className="index-page-meta">
                      <FileText size={12} /> {page.blocks.length} {page.blocks.length === 1 ? 'log block' : 'log blocks'} · updated {new Date(page.updated_at).toLocaleDateString()}
                    </span>
                  </span>
                  <ArrowUpRight size={16} className="index-page-arrow" />
                </button>
              ))
            )}
          </div>
        </motion.div>
      </section>
    </>
  );
}

function ReadingView({ project, page, onBack }: { project: Project; page: Page; onBack: () => void }) {
  return (
    <>
      <FloatingHeader
        left={
          <button data-testid="detail-back-button" onClick={onBack} className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#a8b7b7] transition hover:text-white">
            <ArrowLeft size={15} /> {project.name}
          </button>
        }
        right={<span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#c7f36b]">{project.category || 'Project'}</span>}
      />
      <article className="mx-auto max-w-3xl px-6 pb-24 pt-36 sm:px-10" data-testid="project-detail-page">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-[#c7f36b]">{project.name}</p>
          <h1 className="text-5xl tracking-[-0.06em] sm:text-6xl" data-testid="detail-title">
            {page.title || 'Untitled page'}
            <span className="text-[#c7f36b]">.</span>
          </h1>
          <div className="detail-blocks mt-12 space-y-10" data-testid="detail-blocks">
            {page.blocks.length === 0 ? <div className="gallery-empty">This page has no log entries yet.</div> : page.blocks.map((block) => <LogBlockView key={block.id} block={block} />)}
          </div>
        </motion.div>
      </article>
    </>
  );
}

export function ProjectsPage({ projects, onNavigate }: { projects: Project[]; onNavigate: (route: '/' | '/projects' | '/workspace') => void }) {
  const [drill, setDrill] = useState<Drill>(null);

  let content;
  if (drill?.page) {
    content = <ReadingView project={drill.project} page={drill.page} onBack={() => setDrill({ project: drill.project, page: null })} />;
  } else if (drill) {
    content = <PageIndexView project={drill.project} onBack={() => setDrill(null)} onOpenPage={(page) => setDrill({ project: drill.project, page })} />;
  } else {
    content = (
      <>
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
        <section className="mx-auto min-h-screen max-w-7xl px-6 pb-20 pt-36 sm:px-10 lg:px-16" data-testid="projects-grid-view">
          <div className="mb-12 flex items-end justify-between border-b border-white/10 pb-6">
            <div>
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-[#c7f36b]">Public gallery</p>
              <h1 className="text-5xl tracking-[-0.06em] sm:text-7xl">
                Recorded projects<span className="text-[#c7f36b]">.</span>
              </h1>
            </div>
            <span className="hidden text-xs text-[#718080] sm:block" data-testid="projects-count">
              {projects.length.toString().padStart(2, '0')} recorded
            </span>
          </div>
          {projects.length === 0 ? (
            <div className="gallery-empty" data-testid="projects-empty">
              No projects recorded yet — open the workspace and write the first page.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2" data-testid="projects-grid">
              {projects.map((project, index) => (
                <ProjectSquare key={project.id} project={project} index={index} onOpen={() => setDrill({ project, page: null })} />
              ))}
            </div>
          )}
        </section>
      </>
    );
  }

  return (
    <main className="min-h-screen bg-[#111818] text-[#eef2eb]" data-testid="projects-page">
      {content}
    </main>
  );
}
