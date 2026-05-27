import { useState } from "react";
import { motion } from "motion/react";

const SOCIALS = [
  { label:"GitHub",   abbr:"GH", url:"https://github.com/tykyfatkie",                color:"#39ff14" },
  { label:"Email",    abbr:"EM", url:"mailto:gg.fctaiphat@yahoo.com",                color:"#ff2d78" },
  { label:"Phone",    abbr:"PH", url:"tel:+840932000035",                            color:"#00cfff" },
];

const ContactSection = () => {
  const [state, setState] = useState<"idle"|"sending"|"sent">("idle");

  const submitLabel = state === "idle" ? "Send Message →" : state === "sending" ? "Sending..." : "Message Sent ✓";

  return (
    <section id="contact" style={{ background:"var(--bg)", padding:"8rem 2rem", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ maxWidth:700, width:"100%" }}>

        <motion.div
          initial={{ opacity:0, y:30 }}
          whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }}
          style={{ textAlign:"center", marginBottom:"4rem" }}
        >
          <p className="section-label">04 / Contact</p>
          <h2 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(2.5rem,8vw,5.5rem)", lineHeight:.9, letterSpacing:".02em" }}>
            LET'S <span className="neon-green">BUILD</span>
            <br/>TOGETHER
          </h2>
          <p style={{ color:"#666", lineHeight:1.9, fontSize:".92rem", marginTop:"1.5rem", fontWeight:300 }}>
            Have a project in mind or just want to say hi?<br/>
            I'm always open to new opportunities and collaborations.
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity:0, y:30 }}
          whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }}
          transition={{ delay:.15 }}
          style={{
            background:"var(--glass)",
            border:"0.5px solid var(--glass-border)",
            borderRadius:12,
            padding:"2.5rem",
            backdropFilter:"blur(16px)",
            marginBottom:"2.5rem",
          }}
        >
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"1rem" }}>
            <div>
              <label style={{ display:"block", fontFamily:"var(--font-mono)", fontSize:".62rem", color:"var(--muted)", textTransform:"uppercase", letterSpacing:".1em", marginBottom:".35rem" }}>Name</label>
              <input type="text" placeholder="Your name" className="form-input" />
            </div>
            <div>
              <label style={{ display:"block", fontFamily:"var(--font-mono)", fontSize:".62rem", color:"var(--muted)", textTransform:"uppercase", letterSpacing:".1em", marginBottom:".35rem" }}>Email</label>
              <input type="email" placeholder="your@email.com" className="form-input" />
            </div>
          </div>

          <div style={{ marginBottom:"1rem" }}>
            <label style={{ display:"block", fontFamily:"var(--font-mono)", fontSize:".62rem", color:"var(--muted)", textTransform:"uppercase", letterSpacing:".1em", marginBottom:".35rem" }}>Subject</label>
            <input type="text" placeholder="What's this about?" className="form-input" />
          </div>

          <div style={{ marginBottom:"1.25rem" }}>
            <label style={{ display:"block", fontFamily:"var(--font-mono)", fontSize:".62rem", color:"var(--muted)", textTransform:"uppercase", letterSpacing:".1em", marginBottom:".35rem" }}>Message</label>
            <textarea
              rows={5}
              placeholder="Tell me about your project..."
              className="form-input"
              style={{ resize:"vertical", minHeight:120 }}
            />
          </div>

          <button
            onClick={() => {
              if (state !== "idle") return;
              setState("sending");
              setTimeout(() => { setState("sent"); setTimeout(() => setState("idle"), 3000); }, 1400);
            }}
            style={{
              width:"100%",
              padding:"1rem",
              background: state === "sent" ? "linear-gradient(135deg,#10b981,#059669)"
                        : state === "sending" ? "#333"
                        : "var(--neon)",
              border:"none",
              borderRadius:5,
              color: state === "idle" ? "#000" : "#fff",
              fontFamily:"var(--font-mono)",
              fontSize:".82rem",
              fontWeight:700,
              letterSpacing:".1em",
              textTransform:"uppercase",
              cursor: state === "idle" ? "none" : "default",
              transition:"all .35s",
            }}
            onMouseEnter={e => {
              if (state !== "idle") return;
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 40px rgba(57,255,20,0.35)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = "";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "";
            }}
          >{submitLabel}</button>
        </motion.div>

        {/* Socials */}
        <motion.div
          initial={{ opacity:0, y:16 }}
          whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }}
          transition={{ delay:.3 }}
          style={{ display:"flex", gap:".75rem", justifyContent:"center" }}
        >
          {SOCIALS.map(s => (
            <a
              key={s.abbr}
              href={s.url}
              target={s.url.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              title={s.label}
              style={{
                width:52, height:52,
                background:"var(--glass)",
                border:"0.5px solid var(--glass-border)",
                borderRadius:8,
                display:"flex", alignItems:"center", justifyContent:"center",
                textDecoration:"none",
                color:"var(--muted)",
                fontFamily:"var(--font-mono)", fontSize:".72rem",
                transition:"all .3s",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = s.color;
                el.style.color = s.color;
                el.style.transform = "translateY(-4px)";
                el.style.boxShadow = `0 10px 30px ${s.color}30`;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = "var(--glass-border)";
                el.style.color = "var(--muted)";
                el.style.transform = "";
                el.style.boxShadow = "";
              }}
            >{s.abbr}</a>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ContactSection;
