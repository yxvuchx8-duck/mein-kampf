import { motion } from 'framer-motion';
import { ArrowLeft, Newspaper } from 'lucide-react';
import { LogBlockView } from '@/components/blocks';
import { FloatingHeader } from '@/components/Header';
import type { BlogPost } from '@/data/workspace';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export function BlogPage({ posts, onNavigate }: { posts: BlogPost[]; onNavigate: (route: '/' | '/projects' | '/workspace' | '/blog') => void }) {
  const sorted = [...posts].sort((a, b) => new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime());

  return (
    <main className="min-h-screen bg-[#111818] text-[#eef2eb]" data-testid="blog-page">
      <FloatingHeader
        left={
          <>
            <button data-testid="header-back-button" onClick={() => onNavigate('/')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#a8b7b7] transition hover:text-white">
              <ArrowLeft size={15} /> Back to home
            </button>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#c7f36b]">The blog</span>
          </>
        }
      />
      <section className="mx-auto min-h-screen max-w-3xl px-6 pb-24 pt-36 sm:px-10">
        <div className="mb-14 border-b border-white/10 pb-6">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-[#c7f36b]">Chronological feed</p>
          <h1 className="text-5xl tracking-[-0.06em] sm:text-7xl">
            Field notes<span className="text-[#c7f36b]">.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-[#879797]">Everything I publish, newest first — written in the same log stream as the project pages.</p>
        </div>
        {sorted.length === 0 ? (
          <div className="gallery-empty" data-testid="blog-empty">
            No posts published yet — open the workspace Blog Space and write the first one.
          </div>
        ) : (
          <div className="blog-timeline" data-testid="blog-feed">
            {sorted.map((post, index) => (
              <motion.article
                key={post.id}
                className="blog-post"
                data-testid={`blog-post-${post.id}`}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: index === 0 ? 0.1 : 0, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="blog-post-head">
                  <span className="blog-post-date" data-testid={`blog-date-${post.id}`}>
                    <Newspaper size={13} className="mc-hide" />
                    {formatDate(post.datePublished)}
                  </span>
                  <h2 className="blog-post-title" data-testid={`blog-title-${post.id}`}>
                    {post.title || 'Untitled post'}
                    <span className="text-[#c7f36b]">.</span>
                  </h2>
                </div>
                <div className="detail-blocks mt-8 space-y-10">
                  {post.blocks.length === 0 ? <p className="workspace-empty-hint">This post has no content yet.</p> : post.blocks.map((block) => <LogBlockView key={block.id} block={block} />)}
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
