import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { compressImage, type InlineImage, type LogBlock } from '@/data/workspace';

export function LogBlockEditor({ block, onChange, onRemove, onStorageError }: { block: LogBlock; onChange: (patch: Partial<LogBlock>) => void; onRemove: () => void; onStorageError: (message: string) => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setCompressing(true);
    try {
      const src = await compressImage(file);
      onChange({ images: [...block.images, { id: `img-${Date.now().toString(36)}`, src }] });
    } catch {
      onStorageError('Could not read that image file.');
    } finally {
      setCompressing(false);
    }
  }

  function removeImage(id: string) {
    onChange({ images: block.images.filter((img) => img.id !== id) });
  }

  return (
    <div className="log-block" data-testid={`block-${block.id}`}>
      <div className="log-block-bar">
        <span className="editor-block-type">Log block</span>
        <div className="flex items-center gap-1">
          <button type="button" data-testid={`block-photo-${block.id}`} onClick={() => fileInput.current?.click()} className="log-block-tool" aria-label="Insert photo">
            {compressing ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
            <span>{compressing ? 'Compressing' : 'Insert photo'}</span>
          </button>
          <button type="button" data-testid={`block-remove-${block.id}`} onClick={onRemove} className="editor-block-remove" aria-label="Remove block">
            <Trash2 size={13} />
          </button>
        </div>
        <input ref={fileInput} type="file" accept="image/*" className="hidden" data-testid={`block-file-${block.id}`} onChange={handleFile} />
      </div>
      <textarea data-testid={`block-text-${block.id}`} value={block.text} onChange={(e) => onChange({ text: e.target.value })} rows={5} placeholder="Write your log entry — markdown headings, **bold** and lists all work…" />
      {block.images.length > 0 && (
        <div className="log-block-images">
          {block.images.map((img: InlineImage, index: number) => (
            <div key={img.id} className="log-block-thumb" data-testid={`block-image-${block.id}-${index}`}>
              <img src={img.src} alt={`Inline photo ${index + 1}`} />
              <button type="button" data-testid={`block-image-remove-${block.id}-${index}`} onClick={() => removeImage(img.id)} className="log-block-thumb-remove" aria-label="Remove photo">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MarkdownContent({ text }: { text: string }) {
  return (
    <div className="md-content" data-testid="markdown-content">
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

export function LogBlockView({ block }: { block: LogBlock }) {
  return (
    <div className="log-view-block" data-testid={`view-block-${block.id}`}>
      <MarkdownContent text={block.text} />
      {block.images.length > 0 && (
        <div className={`log-view-images log-view-images-${Math.min(block.images.length, 3)}`}>
          {block.images.map((img, index) => (
            <figure key={img.id} className="log-view-figure" data-testid={`view-image-${block.id}-${index}`}>
              <img src={img.src} alt={`Log photo ${index + 1}`} loading="lazy" />
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
