import { useEffect, useMemo, useRef, useState } from "react";
import { useDeck } from "./SlideDeck";
import { PROJECTS } from "../../data/projects";
import { toggleMusic, isPlaying } from "../../lib/music";
import { bootAudio, playClick, playClose, playOpen, playTick } from "../../hooks/useSound";

interface Cmd {
  id: string;
  group: string;
  label: string;
  hint?: string;
  glyph: string;
  keywords?: string;
  run: () => void;
}

/** Bảng lệnh kiểu dev (Ctrl+K hoặc /): gõ để lọc, ↑↓ chọn, Enter chạy, Esc đóng. Nhảy slide, chọn dự án, mở link, bật/tắt nhạc. */
const CommandPalette = () => {
  const { ids, goTo } = useDeck();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const cmds: Cmd[] = useMemo(() => {
    const go = (id: string) => () => goTo(ids.indexOf(id));
    const list: Cmd[] = [
      { id: "home",     group: "Navigate", label: "Go to Home",     glyph: "⌂", hint: "01", keywords: "hero top start", run: go("hero") },
      { id: "about",    group: "Navigate", label: "Go to About",    glyph: "◐", hint: "02", keywords: "me who profile", run: go("about") },
      { id: "skills",   group: "Navigate", label: "Go to Skills",   glyph: "◈", hint: "03", keywords: "tech stack globe", run: go("skills") },
      { id: "projects", group: "Navigate", label: "Go to Projects", glyph: "▣", hint: "04", keywords: "work portfolio", run: go("projects") },
      { id: "contact",  group: "Navigate", label: "Go to Contact",  glyph: "✉", hint: "05", keywords: "hire mail message", run: go("contact") },
      ...PROJECTS.map<Cmd>(p => ({
        id: `p${p.id}`, group: "Projects", label: p.title, glyph: p.number, hint: p.tag.split("·")[0].trim(),
        keywords: p.tech.join(" "),
        run: () => { goTo(ids.indexOf("projects")); window.dispatchEvent(new CustomEvent("app:select-project", { detail: p.id })); },
      })),
      { id: "github", group: "Links", label: "Open GitHub", glyph: "↗", hint: "tykyfatkie", keywords: "code repo", run: () => window.open("https://github.com/tykyfatkie", "_blank", "noopener") },
      { id: "email",  group: "Links", label: "Send email",  glyph: "↗", hint: "gg.fctaiphat@yahoo.com", keywords: "contact mail", run: () => { window.location.href = "mailto:gg.fctaiphat@yahoo.com"; } },
      { id: "copy",   group: "Links", label: "Copy email address", glyph: "⧉", keywords: "clipboard", run: () => { navigator.clipboard?.writeText("gg.fctaiphat@yahoo.com"); } },
      { id: "music",  group: "System", label: isPlaying() ? "Turn music off" : "Turn music on", glyph: "♪", keywords: "sound audio theme", run: () => { bootAudio(); toggleMusic(); } },
    ];
    return list;
  }, [goTo, ids, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cmds;
    const toks = q.split(/\s+/);
    return cmds.filter(c => {
      const hay = `${c.label} ${c.group} ${c.keywords ?? ""} ${c.hint ?? ""}`.toLowerCase();
      return toks.every(t => hay.includes(t));
    });
  }, [cmds, query]);

  const show = () => {
    if (document.body.dataset.modal && document.body.dataset.modal !== "palette") return;
    document.body.dataset.modal = "palette";
    bootAudio();
    playOpen();
    setQuery(""); setSel(0); setOpen(true);
  };
  const hide = (silent = false) => {
    if (document.body.dataset.modal === "palette") delete document.body.dataset.modal;
    if (!silent) playClose();
    setOpen(false);
  };

  // Phím tắt toàn cục
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) hide(); else show();
      } else if (e.key === "/" && !open && t.tagName !== "INPUT" && t.tagName !== "TEXTAREA") {
        e.preventDefault();
        show();
      } else if (e.key === "Escape" && open) {
        e.preventDefault();
        hide();
      }
    };
    const onOpen = () => show();
    window.addEventListener("keydown", onKey);
    window.addEventListener("app:palette", onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("app:palette", onOpen); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 30); }, [open]);
  useEffect(() => { setSel(0); }, [query]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(".cp__item.is-sel")?.scrollIntoView({ block: "nearest" });
  }, [sel, results]);
  useEffect(() => () => { if (document.body.dataset.modal === "palette") delete document.body.dataset.modal; }, []);

  const run = (c: Cmd) => { hide(true); playClick(); setTimeout(c.run, 60); };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); if (results.length) { setSel(s => (s + 1) % results.length); playTick(); } }
    else if (e.key === "ArrowUp") { e.preventDefault(); if (results.length) { setSel(s => (s - 1 + results.length) % results.length); playTick(); } }
    else if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); const c = results[sel]; if (c) run(c); }
  };

  if (!open) return null;

  let lastGroup = "";
  return (
    <div className="cp" onMouseDown={e => { if (e.target === e.currentTarget) hide(); }}>
      <div className="cp__panel" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="cp__input">
          <span className="cp__prompt">&gt;</span>
          <input
            ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={onInputKey}
            placeholder="Type a command or search…  (projects, contact, github)" spellCheck={false} autoComplete="off"
          />
          <kbd>ESC</kbd>
        </div>

        <div ref={listRef} className="cp__list">
          {results.length === 0 && <div className="cp__empty">No results for “{query}”</div>}
          {results.map((c, i) => {
            const header = c.group !== lastGroup ? (lastGroup = c.group) : null;
            return (
              <div key={c.id}>
                {header && <div className="cp__group">{header}</div>}
                <button
                  className={`cp__item${i === sel ? " is-sel" : ""}`}
                  onMouseEnter={() => setSel(i)} onClick={() => run(c)} data-hover
                >
                  <span className="cp__glyph">{c.glyph}</span>
                  <span className="cp__label">{c.label}</span>
                  {c.hint && <span className="cp__hint">{c.hint}</span>}
                  {i === sel && <span className="cp__enter">↵</span>}
                </button>
              </div>
            );
          })}
        </div>

        <div className="cp__foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
