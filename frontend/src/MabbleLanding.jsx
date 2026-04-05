import { useState, useEffect, useRef } from "react";
import SearchBar from "./SearchBar.jsx";

// ─── DATA ───────────────────────────────────────────────
const freelancers = [
  { name: "Léa Dumont", role: "UI Designer", skills: ["Figma", "Framer", "Webflow"], rating: 4.9, reviews: 47, credits: 15, available: true },
  { name: "Karim Bensaïd", role: "Front-End Developer", skills: ["React", "Next.js", "TypeScript"], rating: 4.8, reviews: 32, credits: 12, available: true },
  { name: "Sofia Chen", role: "Motion Designer", skills: ["After Effects", "Cinema 4D", "Lottie"], rating: 4.7, reviews: 28, credits: 18, available: false },
  { name: "Marcus Aiello", role: "Brand Designer", skills: ["Illustrator", "Photoshop", "InDesign"], rating: 4.9, reviews: 53, credits: 20, available: true },
  { name: "Chloé Martin", role: "3D Artist", skills: ["Blender", "Cinema 4D", "Z Brush"], rating: 4.8, reviews: 41, credits: 14, available: true },
  { name: "Yuki Tanaka", role: "Back-End Developer", skills: ["Node.js", "PostgreSQL", "Redis"], rating: 4.6, reviews: 19, credits: 10, available: true },
  { name: "Emma Blanc", role: "Copywriter", skills: ["SEO", "Storytelling", "UX Writing"], rating: 4.9, reviews: 61, credits: 8, available: false },
  { name: "Ravi Patel", role: "DevOps Engineer", skills: ["Docker", "AWS", "Terraform"], rating: 4.7, reviews: 24, credits: 16, available: true },
];

const freelancers2 = [
  { name: "Antoine Roux", role: "Product Designer", skills: ["Figma", "Protopie", "Maze"], rating: 4.8, reviews: 36, credits: 11, available: true },
  { name: "Nina Kowalski", role: "Illustrator", skills: ["Procreate", "Illustrator", "Pencil"], rating: 4.9, reviews: 58, credits: 22, available: true },
  { name: "Omar Hassan", role: "Video Editor", skills: ["Premiere", "DaVinci", "After Effects"], rating: 4.7, reviews: 29, credits: 17, available: false },
  { name: "Julie Ferrand", role: "UX Researcher", skills: ["Hotjar", "Maze", "Notion"], rating: 4.8, reviews: 44, credits: 13, available: true },
  { name: "David Okonkwo", role: "Full Stack Dev", skills: ["Python", "React", "MongoDB"], rating: 4.6, reviews: 21, credits: 15, available: true },
  { name: "Mia Svensson", role: "Photographer", skills: ["Lightroom", "Capture One", "Studio"], rating: 4.9, reviews: 67, credits: 25, available: true },
  { name: "Théo Lambert", role: "Sound Designer", skills: ["Ableton", "Pro Tools", "Foley"], rating: 4.7, reviews: 18, credits: 9, available: false },
  { name: "Aïcha Diallo", role: "Data Analyst", skills: ["Python", "Tableau", "SQL"], rating: 4.8, reviews: 33, credits: 12, available: true },
];

const categories = ["Web Development", "Design 3D & Animation", "Branding", "Copywriting", "Motion Design", "Mobile Development"];

const howSteps = [
  { num: "01", title: "Create your profile", desc: "List your skills, set your rate in credits, and showcase your portfolio." },
  { num: "02", title: "Find a match", desc: "Search for the talent you need or let the algorithm connect you." },
  { num: "03", title: "Exchange skills", desc: "Collaborate by exchanging credits — no money, just knowledge." },
  { num: "04", title: "Build together", desc: "Launch projects, form teams, and create something amazing." },
];

const stats = [
  { value: "52 827", label: "Active Freelancers" },
  { value: "18k+", label: "Projects Completed" },
  { value: "4.8/5", label: "Average Rating" },
  { value: "120+", label: "Skills Listed" },
];

const getInitials = (name) => name.split(" ").map(n => n[0]).join("");
const avatarColors = ["#E8E8E8", "#D4D4D4", "#C0C0C0", "#ACACAC", "#989898"];
const getAvatarColor = (name) => avatarColors[name.length % avatarColors.length];

export default function MabbleLanding() {
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const carousel1Ref = useRef(null);
  const carousel2Ref = useRef(null);

  useEffect(() => {
    let anim1, anim2;
    let pos1 = 0, pos2 = 0;

    const scroll1 = () => {
      if (carousel1Ref.current) {
        pos1 += 0.5;
        if (pos1 >= carousel1Ref.current.scrollWidth / 2) pos1 = 0;
        carousel1Ref.current.scrollLeft = pos1;
      }
      anim1 = requestAnimationFrame(scroll1);
    };

    const scroll2 = () => {
      if (carousel2Ref.current) {
        pos2 += 0.7;
        if (pos2 >= carousel2Ref.current.scrollWidth / 2) pos2 = 0;
        carousel2Ref.current.scrollLeft = pos2;
      }
      anim2 = requestAnimationFrame(scroll2);
    };

    anim1 = requestAnimationFrame(scroll1);
    anim2 = requestAnimationFrame(scroll2);
    return () => { cancelAnimationFrame(anim1); cancelAnimationFrame(anim2); };
  }, []);

  const FreelancerCard = ({ f }) => (
    <div style={s.card}>
      <div style={s.cardTop}>
        <div style={{ ...s.avatar, background: getAvatarColor(f.name) }}>{getInitials(f.name)}</div>
        <div style={s.cardInfo}>
          <div style={s.cardName}>{f.name}</div>
          <div style={s.cardRole}>{f.role}</div>
        </div>
        <div style={{ ...s.badge, borderColor: f.available ? "#222" : "#ccc", color: f.available ? "#222" : "#aaa" }}>
          {f.available ? "Available" : "Busy"}
        </div>
      </div>
      <div style={s.cardDesc}>{f.description ?? "Creating immersive experiences that wow"}</div>
      <div style={s.cardSkills}>
        {f.skills.map((sk, i) => <span key={i} style={s.skillTag}>{sk}</span>)}
      </div>
      <div style={s.cardBottom}>
        <div style={s.cardRating}>★ {f.rating}<span style={s.reviewCount}>({f.reviews} reviews)</span></div>
        <div style={s.cardCredits}>{f.credits} Credits</div>
      </div>
    </div>
  );

  const serviceToCard = (service) => ({
    name: service.first_name && service.last_name ? `${service.first_name} ${service.last_name}` : `Service #${service.id}`,
    role: `Job ${service.jobs_id}`,
    skills: Array.isArray(service.skills) ? service.skills : service.skills ? String(service.skills).split(',').map((skill) => skill.trim()) : [],
    rating: service.amountMBBL ? Number(service.amountMBBL) : service.amountmbbl ? Number(service.amountmbbl) : 4.5,
    reviews: service.amountUSDC ? Math.max(10, Number(service.amountUSDC) * 3) : 12,
    credits: service.amountMBBL ?? service.amountmbbl ?? 0,
    available: true,
    description: service.description,
  });

  const isSearching = searchQuery.trim() !== "";
  const carousel1Cards = isSearching
    ? searchResults.filter((_, index) => index % 2 === 0).map(serviceToCard)
    : [...freelancers, ...freelancers];

  const carousel2Cards = isSearching
    ? searchResults.filter((_, index) => index % 2 === 1).map(serviceToCard)
    : [...freelancers2, ...freelancers2];

  const noResultsFound = isSearching && !searchLoading && searchResults.length === 0;

  return (
    <div style={s.page}>
      <style>{globalCSS}</style>


      {/* HERO */}
      <section style={s.hero}>
        <h1 style={s.heroTitle}>Trade your skills.<br />Build together.
        </h1>
        <p style={s.heroSub}>Trade your skills and build projects with other creatives</p>

        <div style={{ margin: "0 auto 28px", maxWidth: 720 }}>
          <SearchBar
            onResults={setSearchResults}
            onQuery={setSearchQuery}
            onLoading={setSearchLoading}
            showInlineResults={false}
            placeholder="Search skills, nom, prenom, tags..."
          />
        </div>
        <div style={s.categoryRow}>
          {categories.map((c, i) => <span key={i} style={s.categoryTag}>{c}</span>)}
        </div>
      </section>

      {/* CAROUSEL 1 */}
      {noResultsFound ? (
        <section style={s.noResultsSection}>
          <div style={s.noResultsMessage}>Aucun résultat trouvé pour « {searchQuery} »</div>
        </section>
      ) : (
        <>
          <section style={s.carouselSection}>
            <div
              ref={carousel1Ref}
              style={{
                ...s.carouselTrack,
                justifyContent: carousel1Cards.length <= 2 ? "center" : "flex-start",
              }}
            >
              {carousel1Cards.map((f, i) => <FreelancerCard key={`a${i}`} f={f} />)}
            </div>
          </section>

          <section style={{ ...s.carouselSection, marginTop: 16 }}>
            <div
              ref={carousel2Ref}
              style={{
                ...s.carouselTrack,
                justifyContent: carousel2Cards.length <= 2 ? "center" : "flex-start",
              }}
            >
              {carousel2Cards.map((f, i) => <FreelancerCard key={`b${i}`} f={f} />)}
            </div>
          </section>
        </>
      )}

      {/* STATS */}
      <section style={s.statsBar}>
        {stats.map((st, i) => (
          <div key={i} style={s.statItem}>
            <div style={s.statValue}>{st.value}</div>
            <div style={s.statLabel}>{st.label}</div>
          </div>
        ))}
      </section>

      {/* HOW IT WORKS */}
      <section style={s.howSection}>
        <p style={s.sectionLabel}>How it works</p>
        <h2 style={s.sectionTitle}>From raw talent to collaboration. <span style={s.titleLight}> In 4 steps.</span></h2>
        <div style={s.howGrid}>
          {howSteps.map((step, i) => (
            <div key={i} style={s.howCard}>
              <div style={s.howNum}>{step.num}</div>
              <h3 style={s.howCardTitle}>{step.title}</h3>
              <p style={s.howCardDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>



      {/* TESTIMONIALS */}
      <section style={s.testimonialsSection}>
        <p style={s.sectionLabel}>What they say</p>
        <h2 style={s.sectionTitle}>The community speaks. <span style={s.titleLight}>Listen.</span></h2>
        <div style={s.testimonialsGrid}>
          {[
            { text: "I found a React developer by exchanging my design skills. No money spent, a complete website delivered.", author: "Léa M.", role: "UI Designer" },
            { text: "Mabble allowed me to launch my side project without a budget. The quality of the profiles is impressive.", author: "Thomas R.", role: "Product Manager" },
            { text: "As a junior, this is the best way to build a real portfolio with actual projects.", author: "Aïcha D.", role: "Dev Junior" },
          ].map((t, i) => (
            <div key={i} style={s.testimonialCard}>
              <div style={s.testimonialQuote}>"</div>
              <p style={s.testimonialText}>{t.text}</p>
              <div style={s.testimonialAuthor}>
                <div style={{ ...s.avatar, width: 36, height: 36, fontSize: 13, background: avatarColors[i] }}>{getInitials(t.author)}</div>
                <div>
                  <div style={s.testimonialName}>{t.author}</div>
                  <div style={s.testimonialRole}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={s.ctaSection}>
        <div style={s.ctaBox}>
          <h2 style={s.ctaTitle}>Ready to exchange{"\n"}your talents?</h2>
          <p style={s.ctaSub}>Join 52,000+ creatives collaborating without financial barriers.</p>
          <button style={s.ctaBtn}>Create my profile for free</button>
          <p style={s.ctaNote}>No credit card · 100% free · Instant access</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={s.footer}>
        <div style={s.footerTop}>
          <div style={s.footerBrand}>
            <div style={s.footerLogo}>
              <div style={s.logoDots}>{[0,1,2,3,4].map(i => <span key={i} style={{ ...s.logoDot, background: "#999" }}/>)}</div>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#666", marginLeft: 8 }}>mabble</span>
            </div>
            <p style={s.footerDesc}>The skills exchange platform for creatives and makers.</p>
          </div>
          <div style={s.footerCols}>
            <div style={s.footerCol}>
              <div style={s.footerColTitle}>Product</div>
              {["Explore", "How it works", "Pricing", "API"].map(l => <div key={l} style={s.footerColLink}>{l}</div>)}
            </div>
            <div style={s.footerCol}>
              <div style={s.footerColTitle}>Community</div>
              {["Blog", "Discord", "Events", "Ambassadors"].map(l => <div key={l} style={s.footerColLink}>{l}</div>)}
            </div>
            <div style={s.footerCol}>
              <div style={s.footerColTitle}>Legal</div>
              {["Privacy", "Terms", "ToS", "Contact"].map(l => <div key={l} style={s.footerColLink}>{l}</div>)}
            </div>
          </div>
        </div>
        <div style={s.footerBottom}>
          <span>© 2026 Mabble. All rights reserved.</span>
          <span>Built with skill, not cash.</span>
        </div>
      </footer>
    </div>
  );
}

// ─── STYLES ─────────────────────────────────────────────
const s = {
  page: { margin: 0, padding: 0, background: "#ffffff", color: "#1A1A1A", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", overflowX: "hidden", minHeight: "100vh" },

  nav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 48px", position: "sticky", top: 0, zIndex: 100, background: "rgba(250,250,248,0.85)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" },
  logoArea: { display: "flex", alignItems: "center", gap: "12px" },
  logoDots: { display: "flex", gap: "4px" },
  logoDot: { width: "10px", height: "10px", borderRadius: "50%", background: "#1A1A1A" },
  logoSep: { fontSize: "14px", color: "#999", fontWeight: 400 },
  logoCount: { fontSize: "14px", color: "#888", fontWeight: 400 },
  navRight: { display: "flex", gap: "32px", alignItems: "center" },
  navLink: { background: "none", border: "none", fontSize: "14px", color: "#666", cursor: "pointer", fontFamily: "inherit", padding: 0 },
  navCta: { padding: "10px 28px", background: "#1A1A1A", color: "#FAFAF8", border: "none", borderRadius: "100px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.3px" },

  hero: { textAlign: "center", padding: "80px 48px 60px", maxWidth: "8000px", margin: "0 auto" },
  heroTitle: { fontSize: "clamp(40px, 8vw, 96px)", fontWeight: 700, lineHeight: 1.0, letterSpacing: "-0.05em", margin: "0 0 24px", fontFamily: "'DM Mono', monospace", textTransform: "uppercase" },
  heroLine: { display: "block" },
  heroSub: { fontSize: "16px", color: "#888", fontWeight: 400, marginBottom: "48px", lineHeight: 1.6 },

  shapesRow: { display: "flex", justifyContent: "center", gap: "80px", marginBottom: "56px", alignItems: "center" },
  shapeGroup: { display: "flex", alignItems: "center", gap: "6px" },
  shapeCircle: { borderRadius: "50%", flexShrink: 0 },
  shapeLine: { width: "80px", height: "1px", background: "#D0D0D0" },

  searchWrap: { position: "relative", maxWidth: "480px", margin: "0 auto 28px" },
  searchInput: { width: "100%", padding: "16px 56px 16px 24px", border: "1.5px solid #1A1A1A", borderRadius: "4px", fontSize: "15px", fontFamily: "inherit", background: "transparent", color: "#1A1A1A", outline: "none" },
  searchArrow: { position: "absolute", right: "20px", top: "50%", transform: "translateY(-50%)", fontSize: "18px", color: "#1A1A1A", pointerEvents: "none" },

  categoryRow: { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 20px", marginBottom: "20px" },
  categoryTag: { fontSize: "13px", color: "#777", cursor: "pointer" },

  carouselSection: { padding: 0, overflow: "hidden", marginTop: 24 },
  carouselTrack: { display: "flex", gap: "16px", overflow: "hidden", padding: "8px 0" },
  noResultsSection: { padding: "40px 0", textAlign: "center" },
  noResultsMessage: { fontSize: "18px", color: "#555", fontWeight: 600 },

  card: { minWidth: "280px", maxWidth: "280px", border: "1px solid #E0E0E0", borderRadius: "12px", padding: "20px", background: "#FFFFFF", flexShrink: 0 },
  cardTop: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" },
  avatar: { width: "42px", height: "42px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 600, color: "#555", flexShrink: 0 },
  cardInfo: { flex: 1, minWidth: 0 },
  cardName: { fontSize: "14px", fontWeight: 600, letterSpacing: "-0.2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  cardRole: { fontSize: "12px", color: "#999", marginTop: "1px" },
  badge: { padding: "4px 12px", border: "1px solid #222", borderRadius: "4px", fontSize: "11px", fontWeight: 500, letterSpacing: "0.3px", flexShrink: 0 },
  cardDesc: { fontSize: "13px", color: "#777", marginBottom: "12px", lineHeight: 1.4 },
  cardSkills: { display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" },
  skillTag: { padding: "4px 10px", border: "1px solid #E0E0E0", borderRadius: "4px", fontSize: "11px", color: "#555" },
  cardBottom: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid #F0F0F0" },
  cardRating: { fontSize: "13px", fontWeight: 500, color: "#1A1A1A" },
  reviewCount: { fontSize: "12px", color: "#AAA", fontWeight: 400, marginLeft: "4px" },
  cardCredits: { fontSize: "14px", fontWeight: 700, letterSpacing: "-0.3px" },

  statsBar: { display: "flex", justifyContent: "center", gap: "80px", padding: "80px 48px", borderTop: "1px solid #E8E8E8", borderBottom: "1px solid #E8E8E8", marginTop: "60px" },
  statItem: { textAlign: "center" },
  statValue: { fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, fontFamily: "'DM Mono', monospace", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: "8px" },
  statLabel: { fontSize: "13px", color: "#999", textTransform: "uppercase", letterSpacing: "1.5px" },

  howSection: { padding: "120px 48px", maxWidth: "1200px", margin: "0 auto" },
  sectionLabel: { fontSize: "12px", letterSpacing: "3px", textTransform: "uppercase", color: "#AAA", marginBottom: "16px", fontWeight: 500 },
  sectionTitle: { fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 800, fontFamily: "'DM Mono', monospace", letterSpacing: "-0.02em", lineHeight: 1.15 },
  titleLight: { fontWeight: 300, fontStyle: "italic", color: "#AAA" },
  howGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "32px", marginTop: "64px" },
  howCard: { padding: "32px 24px", borderTop: "2px solid #1A1A1A" },
  howNum: { fontSize: "48px", fontWeight: 800, fontFamily: "'DM Mono', monospace", color: "#E0E0E0", marginBottom: "20px", lineHeight: 1 },
  howCardTitle: { fontSize: "18px", fontWeight: 600, marginBottom: "10px", letterSpacing: "-0.3px" },
  howCardDesc: { fontSize: "14px", color: "#888", lineHeight: 1.6 },

  projectsSection: { padding: "100px 48px 120px", maxWidth: "1200px", margin: "0 auto" },
  projectsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", marginTop: "56px" },
  projectCard: { border: "1px solid #E4E4E4", borderRadius: "12px", overflow: "hidden", background: "#FFF", cursor: "pointer" },
  projectThumb: { height: "160px", background: "linear-gradient(135deg, #F0F0F0 0%, #E4E4E4 100%)", display: "flex", alignItems: "flex-end", padding: "16px" },
  projectThumbInner: { display: "flex", gap: "6px" },
  projectTag: { padding: "4px 10px", background: "rgba(255,255,255,0.8)", borderRadius: "4px", fontSize: "11px", fontWeight: 500, color: "#555" },
  projectInfo: { padding: "20px" },
  projectTitle: { fontSize: "16px", fontWeight: 600, letterSpacing: "-0.3px", marginBottom: "12px" },
  projectMeta: { display: "flex", alignItems: "center", gap: "10px" },
  projectAvatars: { display: "flex" },
  projectAvatarDot: { width: "24px", height: "24px", borderRadius: "50%", border: "2px solid #FFF" },
  projectMembers: { fontSize: "12px", color: "#AAA" },

  testimonialsSection: { padding: "100px 48px 120px", maxWidth: "1200px", margin: "0 auto", borderTop: "1px solid #E8E8E8" },
  testimonialsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", marginTop: "56px" },
  testimonialCard: { padding: "36px 32px", border: "1px solid #E4E4E4", borderRadius: "12px", background: "#FFF" },
  testimonialQuote: { fontSize: "56px", fontFamily: "'DM Mono', monospace", lineHeight: 1, color: "#E0E0E0", marginBottom: "12px" },
  testimonialText: { fontSize: "15px", lineHeight: 1.7, color: "#555", marginBottom: "28px" },
  testimonialAuthor: { display: "flex", alignItems: "center", gap: "12px" },
  testimonialName: { fontSize: "14px", fontWeight: 600 },
  testimonialRole: { fontSize: "12px", color: "#AAA" },

  ctaSection: { padding: "40px 48px 120px" },
  ctaBox: { maxWidth: "800px", margin: "0 auto", textAlign: "center", padding: "80px 60px", border: "2px solid #1A1A1A", borderRadius: "20px" },
  ctaTitle: { fontSize: "clamp(32px, 4.5vw, 52px)", fontWeight: 800, fontFamily: "'DM Mono', monospace", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "16px" },
  ctaSub: { fontSize: "16px", color: "#888", marginBottom: "36px", lineHeight: 1.6, maxWidth: "480px", margin: "0 auto 36px" },
  ctaBtn: { padding: "16px 44px", background: "#1A1A1A", color: "#FAFAF8", border: "none", borderRadius: "100px", fontSize: "15px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.2px" },
  ctaNote: { fontSize: "12px", color: "#BBB", marginTop: "16px" },

  footer: { padding: "60px 48px 40px", borderTop: "1px solid #E8E8E8", maxWidth: "1200px", margin: "0 auto" },
  footerTop: { display: "flex", justifyContent: "space-between", marginBottom: "48px", gap: "80px" },
  footerBrand: { maxWidth: "300px" },
  footerLogo: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" },
  footerDesc: { fontSize: "14px", color: "#AAA", lineHeight: 1.6 },
  footerCols: { display: "flex", gap: "64px" },
  footerCol: { display: "flex", flexDirection: "column", gap: "10px" },
  footerColTitle: { fontSize: "13px", fontWeight: 600, letterSpacing: "0.5px", marginBottom: "4px", textTransform: "uppercase" },
  footerColLink: { fontSize: "14px", color: "#999", cursor: "pointer" },
  footerBottom: { display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#CCC", paddingTop: "24px", borderTop: "1px solid #F0F0F0" },
};

const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400&family=Playfair+Display:ital,wght@0,400;0,700;0,800;1,300;1,400&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  ::selection { background: rgba(26,26,26,0.12); color: #1A1A1A; }
`;
