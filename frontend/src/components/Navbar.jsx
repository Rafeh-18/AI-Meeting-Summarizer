import { Link } from 'react-router-dom'
import { Mic } from 'lucide-react'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="container">
        {/* Logo */}
        <Link to="/" className="nav-logo">
          <span className="nav-logo-icon">
            <Mic size={16} color="#fff" />
          </span>
          Clario
        </Link>

        {/* Nav links */}
        <ul className="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#how-it-works">How it works</a></li>
          <li><a href="#pricing">Pricing</a></li>
        </ul>

        {/* Auth actions */}
        <div className="nav-actions">
          <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get started</Link>
        </div>
      </div>
    </nav>
  )
}