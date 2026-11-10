import { useEffect, useRef, useState } from 'react';

type Particle = {
  x: number;
  size: number;
  speed: number;
  drift: number;
  phase: number;
  kind: 'smoke' | 'orb';
  opacity: number;
};

const NODE_COUNT = 9;
const SPAWN_COUNT = 16;

export function FooterCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mc, setMc] = useState(() => document.documentElement.classList.contains('minecraft'));

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setMc(root.classList.contains('minecraft')));
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = host.clientWidth;
    let height = host.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      width = host.clientWidth;
      height = host.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const mouse = { x: -9999, y: -9999, active: false };
    const onMove = (e: MouseEvent) => {
      const rect = host.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
      mouse.x = -9999;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseout', onLeave);

    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const particles: Particle[] = Array.from({ length: SPAWN_COUNT }, () => ({
      x: Math.random(),
      size: rand(4, 11),
      speed: rand(8, 22),
      drift: rand(-8, 8),
      phase: Math.random() * Math.PI * 2,
      kind: Math.random() > 0.45 ? 'orb' : 'smoke',
      opacity: rand(0.35, 0.85),
    }));

    const light = () => document.documentElement.classList.contains('light');
    let raf = 0;

    const draw = (now: number) => {
      ctx.clearRect(0, 0, width, height);
      const t = now / 1000;

      if (!mc) {
        const accent = light() ? 'rgba(77,124,23,' : 'rgba(199,243,107,';
        const alt = light() ? 'rgba(90,140,120,' : 'rgba(93,225,230,';
        const base = light() ? 'rgba(22,33,26,' : 'rgba(238,242,235,';
        const rows = 3;
        const cols = NODE_COUNT * 3;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const nx = (c / (cols - 1)) * width;
            const ny = height * 0.3 + r * height * 0.26 + Math.sin(t * 0.7 + c * 0.55 + r) * 5;
            const dx = nx - mouse.x;
            const dy = ny - mouse.y;
            const dist = Math.hypot(dx, dy);
            const glow = mouse.active ? Math.max(0, 1 - dist / 150) : 0;
            const size = 1.6 + glow * 2.6;
            ctx.fillStyle = glow > 0.12 ? `${accent}${0.25 + glow * 0.65})` : `${base}${0.14 + Math.sin(t + c + r) * 0.04})`;
            ctx.fillRect(nx - size / 2, ny - size / 2, size, size);
          }
        }
        ctx.beginPath();
        const midY = height * 0.56;
        for (let x = 0; x <= width; x += 8) {
          let y = midY + Math.sin(x * 0.012 + t * 0.9) * 5;
          const d = Math.hypot(x - mouse.x, midY - mouse.y);
          if (mouse.active && d < 170) {
            const pull = (1 - d / 170) * 16;
            y += (mouse.y - midY) * 0.25 * (1 - d / 170) + pull * Math.sign(mouse.y - midY) * 0.3;
          }
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `${accent}0.55)`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.beginPath();
        for (let x = 0; x <= width; x += 12) {
          const y = midY + 16 + Math.sin(x * 0.02 - t * 0.6) * 3;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `${alt}0.3)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        for (const p of particles) {
          const px = p.x * width + Math.sin(t * 0.5 + p.phase) * p.drift;
          const travel = (t * p.speed) % (height + 60);
          const py = height + 20 - travel;
          const fade = Math.min(1, travel / 30) * Math.min(1, (height + 40 - travel) / 30);
          ctx.globalAlpha = p.opacity * fade;
          if (p.kind === 'orb') {
            ctx.fillStyle = '#55ff55';
            const s = Math.round(p.size / 2) * 2;
            ctx.shadowColor = '#55ff55';
            ctx.shadowBlur = 6;
            ctx.fillRect(Math.round(px / 2) * 2, Math.round(py / 2) * 2, s, s);
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255,255,85,.85)';
            ctx.fillRect(Math.round(px / 2) * 2 + s / 4, Math.round(py / 2) * 2 + s / 4, Math.max(2, s / 2), Math.max(2, s / 2));
          } else {
            ctx.fillStyle = '#3a3a3a';
            const s = Math.round(p.size * 1.4 / 2) * 2;
            ctx.fillRect(Math.round(px / 2) * 2, Math.round(py / 2) * 2, s, s);
            ctx.fillStyle = '#585858';
            ctx.fillRect(Math.round(px / 2) * 2 + 2, Math.round(py / 2) * 2 + 2, Math.max(2, s - 4), Math.max(2, s - 4));
          }
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(0,0,0,.55)';
        for (let x = 0; x < width; x += 24) ctx.fillRect(x, height - 3, 24, 3);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseout', onLeave);
    };
  }, [mc]);

  return (
    <div ref={hostRef} className="footer-canvas" data-testid="footer-canvas" aria-hidden="true">
      <canvas ref={canvasRef} className="footer-canvas-el" />
    </div>
  );
}
