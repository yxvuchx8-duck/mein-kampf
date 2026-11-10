import { FormEvent, useEffect, useRef, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, ExternalLink, LockKeyhole, X } from 'lucide-react';
import Lenis from 'lenis';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { loadWorkspace, saveWorkspace, type WorkspaceState } from '@/data/workspace';
import { FloatingHeader } from '@/components/Header';
import { WorkspacePage } from '@/components/WorkspacePage';
import { ProjectsPage } from '@/components/ProjectsPage';

const logo = '/assets/Screenshot_2026-11-10_133726.png';
const ACCESS_CODE = '1769';

type Route = '/' | '/projects' | '/workspace';

function getRoute(): Route {
  if (window.location.pathname === '/projects') return '/projects';
  if (window.location.pathname === '/workspace') return '/workspace';
  return '/';
}

const lineReveal = {
  hidden: { y: '115%' },
  visible: (index: number) => ({
    y: '0%',
    transition: { delay: 0.15 + index * 0.13, duration: 0.9, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

function RevealLine({ index, children, className = '' }: { index: number; children: React.ReactNode; className?: string }) {
  return (
    <span className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
      <motion.span className={`block ${className}`} custom={index} variants={lineReveal} initial="hidden" animate="visible">
        {children}
      </motion.span>
    </span>
  );
}

function LogoMark({ size = 'h-12 w-12' }: { size?: string }) {
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-full border border-white/20 ${size}`}>
      <img src={logo} alt="Gemer logo" className="h-full w-full object-cover" />
    </div>
  );
}

function HomeHeader({ onNavigate }: { onNavigate: (route: Route) => void }) {
  return (
    <FloatingHeader
      left={
        <button data-testid="header-logo-button" onClick={() => onNavigate('/')} className="rounded-full transition hover:opacity-75" aria-label="Return to Gemer home">
          <LogoMark size="h-10 w-10" />
        </button>
      }
    />
  );
}

function SplashScreen({ leaving }: { leaving: boolean }) {
  return (
    <div data-testid="splash-screen" className={`splash-screen ${leaving ? 'splash-leaving' : ''}`} aria-label="Loading Gemer">
      <div className="splash-grid" />
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative flex h-40 w-40 items-center justify-center">
          <span className="logo-orbit" />
          <span className="logo-orbit logo-orbit-reverse" />
          <LogoMark size="h-32 w-32 splash-logo" />
        </div>
        <div className="mt-10 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a8b7b7]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c7f36b]" />
          Loading
        </div>
        <div className="mt-4 h-px w-36 overflow-hidden bg-white/10">
          <div className="loading-line h-full bg-[#c7f36b]" />
        </div>
      </div>
      <div className="absolute bottom-8 left-8 right-8 flex justify-between text-[10px] uppercase tracking-[0.25em] text-white/30 sm:left-12 sm:right-12">
        <span>GM / 01</span>
        <span>Gemer</span>
      </div>
    </div>
  );
}

function AccessModal({ onClose, onGranted }: { onClose: () => void; onGranted: () => void }) {
  const [code, setCode] = useState('');
  const [denied, setDenied] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (code === ACCESS_CODE) {
      onGranted();
      return;
    }
    setDenied(true);
    setCode('');
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="access-title" data-testid="access-modal">
      <div className={`access-modal ${denied ? 'access-denied' : ''}`}>
        <button data-testid="access-modal-close" onClick={onClose} className="absolute right-5 top-5 rounded-full p-2 text-[#879797] transition hover:bg-white/10 hover:text-white" aria-label="Close access dialog">
          <X size={18} />
        </button>
        <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#c7f36b]/30 bg-[#c7f36b]/10 text-[#c7f36b]">
          <LockKeyhole size={21} />
        </div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-[#c7f36b]">Restricted area</p>
        <h2 id="access-title" className="text-3xl tracking-[-0.05em] text-white">Workspace access</h2>
        <p className="mt-3 max-w-sm text-sm leading-6 text-[#879797]">Enter your access code to open the project editor.</p>
        <form onSubmit={handleSubmit} className="mt-8">
          <label htmlFor="access-code" className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#718080]">
            Access code
          </label>
          <input
            data-testid="access-code-input"
            type="password"
            autoFocus
            id="access-code"
            inputMode="numeric"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setDenied(false);
            }}
            className="code-input"
            placeholder="••••"
            aria-describedby={denied ? 'access-error' : undefined}
          />
          <button data-testid="access-submit-button" type="submit" className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#c7f36b] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#162016] transition hover:bg-white">
            Unlock workspace <ArrowUpRight size={15} />
          </button>
        </form>
        {denied && (
          <p data-testid="access-error" id="access-error" className="mt-4 flex items-center gap-2 text-xs text-[#f28a6d]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f28a6d]" />
            Access Denied
          </p>
        )}
      </div>
    </div>
  );
}

const marqueeItems = ['Enough Talent Can Beat Hardwork', 'Gemer', 'Projects & Random Things', 'Documented With Curiosity'];

function EditorialMarquee() {
  const row = [...marqueeItems, ...marqueeItems];
  return (
    <div className="marquee" data-testid="editorial-marquee" aria-hidden="true">
      <div className="marquee-track">
        {[0, 1].map((half) => (
          <div key={half} className="marquee-half">
            {row.map((item, index) => (
              <span key={`${half}-${index}`} className="marquee-item">
                {item}
                <span className="marquee-dot" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function HomePage({ onNavigate }: { onNavigate: (route: Route) => void }) {
  const [accessOpen, setAccessOpen] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const glowY = useTransform(scrollYProgress, [0, 1], ['0%', '35%']);
  const headlineY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);

  return (
    <main className="min-h-screen overflow-hidden bg-[#111818] text-[#eef2eb]" data-testid="home-page">
      <HomeHeader onNavigate={onNavigate} />
      <section ref={heroRef} className="relative mx-auto flex min-h-[760px] max-w-7xl items-end px-6 pb-20 pt-40 sm:px-10 lg:min-h-screen lg:px-16 lg:pb-28">
        <motion.div className="hero-glow" style={{ y: glowY }} />
        <motion.div className="relative z-10 max-w-6xl" style={{ y: headlineY }}>
          <motion.div
            className="mb-8 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#c7f36b]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#c7f36b]" />
            Gemer
          </motion.div>
          <h1 className="max-w-6xl text-[clamp(3.4rem,9vw,9rem)] font-medium leading-[0.9] tracking-[-0.08em] text-[#eff3eb]" data-testid="hero-headline">
            <RevealLine index={0}>Enough Talent</RevealLine>
            <RevealLine index={1}>
              Can Beat <span className="text-[#c7f36b]">Hardwork</span>
              <span className="text-[#c7f36b]">.</span>
            </RevealLine>
          </h1>
          <motion.p
            className="mt-10 max-w-md text-base leading-7 text-[#a8b7b7]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            I document my projects and some random things here.
          </motion.p>
        </motion.div>
        <div className="absolute bottom-8 right-6 hidden text-right text-[10px] uppercase tracking-[0.25em] text-white/30 sm:right-10 lg:right-16 lg:block">
          Explore the site
          <br />
          <span className="text-[#c7f36b]">↓</span>
        </div>
      </section>

      <EditorialMarquee />

      <section className="action-section border-y border-white/10">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-3 lg:px-16">
          <motion.a
            data-testid="action-about"
            href="https://amarpreetsahoo.framer.website/"
            target="_blank"
            rel="noreferrer"
            className="action-card action-cyan"
            initial={{ opacity: 0, y: 34 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="action-index">01</span>
            <span className="action-title">About Me</span>
            <span className="action-arrow">
              <ExternalLink size={19} />
            </span>
            <span className="action-caption">A little context</span>
          </motion.a>
          <motion.button
            data-testid="action-workspace"
            onClick={() => setAccessOpen(true)}
            className="action-card action-lime text-left"
            initial={{ opacity: 0, y: 34 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="action-index">02</span>
            <span className="action-title">yxvuchx8</span>
            <span className="action-arrow">
              <LockKeyhole size={18} />
            </span>
            <span className="action-caption">Admin workspace access</span>
          </motion.button>
          <motion.button
            data-testid="action-projects"
            onClick={() => onNavigate('/projects')}
            className="action-card action-amber text-left"
            initial={{ opacity: 0, y: 34 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="action-index">03</span>
            <span className="action-title">View Projects</span>
            <span className="action-arrow">
              <ArrowDownRight size={20} />
            </span>
            <span className="action-caption">Browse the public gallery</span>
          </motion.button>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl items-center justify-between border-t border-white/10 px-6 py-8 text-xs text-[#718080] sm:px-10 lg:px-16">
        <div className="flex items-center gap-3">
          <LogoMark size="h-8 w-8" />
          <span>© 2026 Gemer</span>
        </div>
        <span className="flex items-center gap-2">
          Built with curiosity <ArrowUpRight size={14} />
        </span>
      </footer>

      <AnimatePresence>
        {accessOpen && (
          <AccessModal
            onClose={() => setAccessOpen(false)}
            onGranted={() => {
              setAccessOpen(false);
              onNavigate('/workspace');
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [route, setRoute] = useState<Route>(getRoute);
  const [workspace, setWorkspace] = useState<WorkspaceState>(loadWorkspace);
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    if (!saveWorkspace(workspace)) {
      setStorageError('Browser storage is full — the latest change was not saved. Remove a few photos and try again.');
    }
  }, [workspace]);

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    let frame = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const exitTimer = window.setTimeout(() => setLeaving(true), 2100);
    const hideTimer = window.setTimeout(() => setShowSplash(false), 2700);
    const handlePopState = () => setRoute(getRoute());
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(hideTimer);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  function navigate(nextRoute: Route) {
    window.history.pushState({}, '', nextRoute);
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  if (showSplash) return <SplashScreen leaving={leaving} />;
  if (route === '/projects') return <ProjectsPage projects={workspace.projects} onNavigate={navigate} />;
  if (route === '/workspace') return <WorkspacePage state={workspace} setState={setWorkspace} storageError={storageError} clearStorageError={() => setStorageError('')} onNavigate={navigate} />;
  return <HomePage onNavigate={navigate} />;
}

export default App;
