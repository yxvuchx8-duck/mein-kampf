import ReactMarkdown from 'react-markdown';
import { ArrowUpRight, Trash2 } from 'lucide-react';
import type { Block } from '@/data/workspace';

export function renderVideoEmbed(url: string): { kind: 'youtube' | 'vimeo' | 'file'; src: string } | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return { kind: 'youtube', src: `https://www.youtube.com/embed/${yt[1]}` };
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return { kind: 'vimeo', src: `https://player.vimeo.com/video/${vimeo[1]}` };
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return { kind: 'file', src: url };
  return null;
}

export function MarkdownContent({ text, dark = true }: { text: string; dark?: boolean }) {
  return (
    <div className={`md-content ${dark ? '' : 'md-light'}`} data-testid="markdown-content">
      <ReactMarkdown
        components={{
          code({ className, children, ...props }) {
            const isBlock = /language-/.test(className ?? '');
            if (isBlock) {
              return (
                <pre className="md-pre">
                  <code className={className}>{children}</code>
                </pre>
              );
            }
            return (
              <code className="md-inline-code" {...props}>
                {children}
              </code>
            );
          },
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noreferrer" className="md-link">
                {children}
              </a>
            );
          },
        }}
      >
        {text || '*Nothing written here yet.*'}
      </ReactMarkdown>
    </div>
  );
}

export function VideoEmbed({ url }: { url: string }) {
  const embed = renderVideoEmbed(url);
  if (!embed) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="video-fallback" data-testid="video-fallback">
        <ArrowUpRight size={14} /> Open video link
      </a>
    );
  }
  if (embed.kind === 'file') {
    return <video className="media-frame" controls src={embed.src} data-testid="video-embed" />;
  }
  return (
    <div className="video-frame" data-testid="video-embed">
      <iframe src={embed.src} title="Embedded video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" />
    </div>
  );
}

export function BlockView({ block }: { block: Block }) {
  if (block.type === 'image') {
    if (!block.text) return null;
    return (
      <figure className="block-image" data-testid={`view-block-${block.id}`}>
        <img src={block.text} alt="Project visual" loading="lazy" />
      </figure>
    );
  }
  if (block.type === 'video') {
    return (
      <div className="block-video" data-testid={`view-block-${block.id}`}>
        <VideoEmbed url={block.text} />
      </div>
    );
  }
  if (block.type === 'code') {
    return (
      <div className="block-code" data-testid={`view-block-${block.id}`}>
        <div className="block-code-label">{block.language}</div>
        <pre className="md-pre">
          <code>{block.text}</code>
        </pre>
      </div>
    );
  }
  return (
    <div className="block-markdown" data-testid={`view-block-${block.id}`}>
      <MarkdownContent text={block.text} />
    </div>
  );
}

export function BlockEditor({ block, onChange, onRemove }: { block: Block; onChange: (patch: Partial<Block>) => void; onRemove: () => void }) {
  return (
    <div className={`editor-block editor-block-${block.type}`} data-testid={`block-${block.id}`}>
      <div className="editor-block-bar">
        <span className="editor-block-type">{block.type}</span>
        <button type="button" data-testid={`block-remove-${block.id}`} onClick={onRemove} className="editor-block-remove" aria-label="Remove block">
          <Trash2 size={13} />
        </button>
      </div>
      {block.type === 'markdown' && (
        <textarea data-testid={`block-text-${block.id}`} value={block.text} onChange={(e) => onChange({ text: e.target.value })} rows={4} placeholder="Write with markdown — # headings, **bold**, - lists, `code`…" />
      )}
      {block.type === 'image' && (
        <>
          <input data-testid={`block-text-${block.id}`} value={block.text} onChange={(e) => onChange({ text: e.target.value })} placeholder="https:// — paste an image URL" />
          {block.text && <img className="editor-image-preview" src={block.text} alt="Preview" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} onLoad={(e) => ((e.target as HTMLImageElement).style.display = 'block')} />}
        </>
      )}
      {block.type === 'video' && (
        <input data-testid={`block-text-${block.id}`} value={block.text} onChange={(e) => onChange({ text: e.target.value })} placeholder="https://youtube.com/watch?v=… or .mp4 link" />
      )}
      {block.type === 'code' && (
        <>
          <input data-testid={`block-language-${block.id}`} value={block.language} onChange={(e) => onChange({ language: e.target.value })} placeholder="language (js, python, css…)" className="editor-code-language" />
          <textarea data-testid={`block-text-${block.id}`} value={block.text} onChange={(e) => onChange({ text: e.target.value })} rows={6} placeholder="// paste code here" className="editor-code-textarea" spellCheck={false} />
        </>
      )}
    </div>
  );
}
