import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  Mic,
  FileText,
  CheckSquare,
  Download,
  Search,
  MessageSquare,
  ArrowRight,
  Zap,
  Clock,
  Shield,
  Globe,
} from "lucide-react";

function Waveform() {
  return (
    <div className="hero-waveform">
      {Array.from({ length: 11 }, (_, i) => (
        <div key={i} className="wv-bar" />
      ))}
    </div>
  );
}

const FEATURES = [
  {
    icon: Mic,
    title: "Live recording",
    desc: "Record straight from your browser. Processing starts the moment you stop.",
  },
  {
    icon: FileText,
    title: "Accurate transcription",
    desc: "Faster-Whisper converts speech to text with near-human accuracy across accents.",
  },
  {
    icon: CheckSquare,
    title: "Action item extraction",
    desc: "Every commitment is surfaced automatically — who owns it and when it is due.",
  },
  {
    icon: Download,
    title: "PDF reports",
    desc: "One-click professional reports with cover pages, summaries, and full transcripts.",
  },
  {
    icon: Search,
    title: "Full-text search",
    desc: "Search every word spoken across your entire meeting history in milliseconds.",
  },
  {
    icon: MessageSquare,
    title: "AI chat",
    desc: "Ask any question about a meeting and get a grounded, sourced answer.",
  },
];

export default function Home() {
  return (
    <>
      <Navbar />
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-badge"></div>
          <h1 className="display-xl hero-heading anim-fade-up">
            Turn every meeting into a{" "}
            <span className="gradient-text">clear record</span>
          </h1>
          <p
            className="body-lg hero-sub anim-fade-up anim-delay-1"
            style={{ color: "var(--text-2)" }}
          >
            Clario transcribes your calls, extracts action items, flags risks,
            and delivers a professional PDF — automatically.
          </p>
          <div className="hero-ctas anim-fade-up anim-delay-2">
            <Link to="/register" className="btn btn-primary btn-lg">
              Start for free <ArrowRight size={17} />
            </Link>
            <a href="#how-it-works" className="btn btn-ghost btn-lg">
              See how it works
            </a>
          </div>
          <Waveform />
          <p className="waveform-label">Processing your meeting in real time</p>
        </div>
      </section>

      <section className="section" id="features">
        <div className="container">
          <div className="section-header">
            <p className="section-eyebrow">
              <Shield size={12} /> Everything you need
            </p>
            <h2 className="display-lg">Built for real meetings</h2>
          </div>
          <div className="features-grid">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="feature-card">
                <div className="feature-icon">
                  <Icon size={20} />
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="how-works" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <p className="section-eyebrow">
              <Clock size={12} /> Three steps
            </p>
            <h2 className="display-lg">From recording to report</h2>
          </div>
          <div className="steps-row">
            {[
              {
                n: "1",
                title: "Upload or record",
                desc: "Drop an audio or video file, or hit record. Any format, any length.",
              },
              {
                n: "2",
                title: "AI processes it",
                desc: "Whisper transcribes, then an LLM extracts summary, actions, and risks.",
              },
              {
                n: "3",
                title: "Get your report",
                desc: "Download a structured PDF or review everything right in your dashboard.",
              },
            ].map(({ n, title, desc }) => (
              <div key={n} className="step-item">
                <div className="step-num">{n}</div>
                <h3>{title}</h3>
                <p style={{ color: "var(--text-2)", fontSize: "0.875rem" }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <span className="badge badge-accent" style={{ marginBottom: 20 }}>
              <Globe size={11} /> Free to start
            </span>
            <h2 className="display-lg">Ready to reclaim your meetings?</h2>
            <p
              className="body-lg"
              style={{ color: "var(--text-2)", marginBottom: 32 }}
            >
              Join teams who never take meeting notes manually again.
            </p>
            <div className="cta-btns">
              <Link to="/register" className="btn btn-primary btn-lg">
                Create free account <ArrowRight size={17} />
              </Link>
              <Link to="/login" className="btn btn-ghost btn-lg">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <p className="footer-copy">© 2026 Clario.</p>
          <nav className="footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">GitHub</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
