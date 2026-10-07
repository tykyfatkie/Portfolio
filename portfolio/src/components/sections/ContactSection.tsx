import { lazy, Suspense, useRef, useState, type FormEvent } from "react";
import ScrambleText from "../ui/ScrambleText";
import Backdrop from "../3d/Backdrops";
import type { GlobeHandle } from "../3d/ContactGlobe";
import { playClick, playClose, playOpen } from "../../hooks/useSound";

const ContactGlobe = lazy(() => import("../3d/ContactGlobe"));

const MAIL = "gg.fctaiphat@yahoo.com";
/** Đặt VITE_FORM_ENDPOINT (vd. https://formspree.io/f/xxxxxxx) trong file .env để form gửi thật. Không có thì mở ứng dụng mail với nội dung điền sẵn. */
const ENDPOINT = import.meta.env.VITE_FORM_ENDPOINT as string | undefined;

const SOCIALS = [
  { label: "GitHub", abbr: "GH", url: "https://github.com/tykyfatkie", color: "#39ff14" },
  { label: "Email",  abbr: "EM", url: `mailto:${MAIL}`,                color: "#ff2d78" },
  { label: "Phone",  abbr: "PH", url: "tel:+840932000035",             color: "#00cfff" },
];

type Status = "idle" | "sending" | "sent" | "mailto" | "error";

const ContactSection = () => {
  const globe = useRef<GlobeHandle | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState("");
  const [f, setF] = useState({ name: "", email: "", subject: "", message: "", _gotcha: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF(s => ({ ...s, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    if (f._gotcha) return;                                            // bot điền ô ẩn → bỏ qua
    if (!f.name.trim() || !/^\S+@\S+\.\S+$/.test(f.email) || f.message.trim().length < 5) {
      setErr("Please fill in your name, a valid email and a short message."); setStatus("error"); playClose(); return;
    }
    setErr(""); setStatus("sending"); playOpen();
    globe.current?.transmit();                                         // gói tin bay về TP.HCM
    const minWait = new Promise(r => setTimeout(r, 1900));            // để hiệu ứng truyền tin kịp chạy xong
    try {
      if (ENDPOINT) {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ name: f.name, email: f.email, subject: f.subject || "Portfolio contact", message: f.message }),
        });
        await minWait;
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        setStatus("sent"); playClick();
        setF({ name: "", email: "", subject: "", message: "", _gotcha: "" });
      } else {
        await minWait;
        const body = `${f.message}\n\n— ${f.name} <${f.email}>`;
        window.location.href = `mailto:${MAIL}?subject=${encodeURIComponent(f.subject || "Portfolio contact")}&body=${encodeURIComponent(body)}`;
        setStatus("mailto"); playClick();
      }
    } catch (ex) {
      await minWait;
      setErr(ex instanceof Error ? ex.message : "Something went wrong."); setStatus("error"); playClose();
    }
  };

  const label = status === "sending" ? "Transmitting…" : status === "sent" ? "Message received ✓" : status === "mailto" ? "Opened in mail app ✓" : "Send message →";

  return (
    <section id="contact" style={{ background: "var(--bg)", padding: "7rem 2rem 4rem", minHeight: "100vh" }}>
      <Backdrop kind="horizon" opacity={0.6} />

      <div className="ct-wrap">
        <div data-fx="up" className="ct-head">
          <p className="section-label">04 / Contact</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem,7vw,5.2rem)", lineHeight: .92, letterSpacing: ".02em" }}>
            LET'S <ScrambleText text="BUILD" className="neon-green" /> TOGETHER
          </h2>
          <p style={{ color: "#777", lineHeight: 1.9, fontSize: ".92rem", marginTop: "1rem", fontWeight: 300 }}>
            Have a project in mind or just want to say hi? I'm based in Ho Chi Minh City and work with teams anywhere.
          </p>
        </div>

        <div className="ct-grid">
          {/* Địa cầu hologram */}
          <div data-fx="zoom" className="ct-globe">
            <Suspense fallback={<div className="contact-globe" />}>
              <ContactGlobe handle={globe} />
            </Suspense>
            <p className="ct-globe__hint">◐ drag to rotate · signals travel from Ho Chi Minh City</p>
          </div>

          {/* Bảng điều khiển truyền tin */}
          <div data-fx="right" className="ct-console">
            <div className="ct-console__bar"><i /><i /><i /><span>transmit.sh — message to Phat</span></div>

            <form className="ct-form" onSubmit={submit} noValidate>
              <div className="ct-row">
                <label><span>--name</span><input className="form-input" value={f.name} onChange={set("name")} placeholder="Your name" autoComplete="name" /></label>
                <label><span>--email</span><input className="form-input" type="email" value={f.email} onChange={set("email")} placeholder="your@email.com" autoComplete="email" /></label>
              </div>
              <label><span>--subject</span><input className="form-input" value={f.subject} onChange={set("subject")} placeholder="What's this about?" /></label>
              <label><span>--message</span><textarea className="form-input" rows={5} value={f.message} onChange={set("message")} placeholder="Tell me about your project..." style={{ resize: "vertical", minHeight: 120 }} /></label>
              {/* ô ẩn chống bot */}
              <input tabIndex={-1} autoComplete="off" value={f._gotcha} onChange={set("_gotcha")} style={{ position: "absolute", left: "-9999px", opacity: 0 }} aria-hidden />

              <button type="submit" className={`ct-send is-${status}`} disabled={status === "sending"} data-hover>{label}</button>

              <p className={`ct-status is-${status}`} role="status">
                {status === "error" && <>✗ {err}</>}
                {status === "sent" && <>✓ Thanks! Your message reached me — I'll reply soon.</>}
                {status === "mailto" && <>✓ Your mail app should open with the message prefilled. (Set <b>VITE_FORM_ENDPOINT</b> to send directly from the site.)</>}
                {(status === "idle" || status === "sending") && <>&gt; {status === "sending" ? "signal in flight…" : "ready to transmit"}<span className="ct-caret">_</span></>}
              </p>
            </form>

            <div className="ct-socials">
              {SOCIALS.map(s => (
                <a key={s.abbr} href={s.url} target={s.url.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" title={s.label} style={{ "--c": s.color } as React.CSSProperties} data-hover>{s.abbr}</a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
