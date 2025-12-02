'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const [showAuthDropdown, setShowAuthDropdown] = useState(false);

  useEffect(() => {
    // Load Spline viewer script dynamically
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://unpkg.com/@splinetool/viewer@1.12.5/build/spline-viewer.js';
    

    document.body.appendChild(script);

    return () => {
      // Cleanup script on component unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (showAuthDropdown && !event.target.closest('.auth-dropdown')) {
        setShowAuthDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAuthDropdown]);

  return (
    <div className="landing-page" style={{ backgroundColor: 'black', color: '#e7e7e7' }}>
      {/* Background gradient & blur */}
      <Image 
        className="image-gradient" 
        src="/gradient.png" 
        alt="gradient"
        width={800}
        height={600}
      />
      <div className="layer-blur"></div>

      <div className="landing-container">
        {/* HEADER */}
        <header className="landing-header">

          {/* FIX: Aligned items to flex-start to allow manual margin push on text */}
          <div className="logo-container" style={{ display: 'flex', alignItems: 'flex-start' }}>
            <Image 
              src="/image.png" 
              alt="Gemini Generated Logo" 
              className="logo-img"
              width={60}
              height={60}
              style={{ display: 'block' }} 
            />
            {/* FIX: Added marginTop: '15px' to push text down */}
            <h1 
              className="logo" 
              style={{ 
                margin: '15px 0 0 24px', // Top(15px) Right(0) Bottom(0) Left(24px)
                padding: 0, 
                lineHeight: '1',
                position: 'static', 
                transform: 'none'
              }}
            >
              InvisiMail
            </h1>
          </div>

          <nav className="landing-nav">
            <a href="#features">Features</a>
            <a href="#trust">Trust</a>
            <a href="#faq">FAQ</a>
            <div className="auth-dropdown">
              <button 
                className="btn-signing"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Button clicked, current state:', showAuthDropdown);
                  setShowAuthDropdown(!showAuthDropdown);
                }}
                type="button"
              >
                Login/Signup
              </button>
              {showAuthDropdown && (
                <div className="auth-dropdown-menu">
                  <Link href="/signin" className="auth-dropdown-item">
                    Sign In
                  </Link>
                  <Link href="/register" className="auth-dropdown-item">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </header>

        {/* HERO */}
        <main className="landing-main">
          <div className="landing-content">
            <div className="tag-box">
              <div className="tag">Protect Your Inbox</div>
            </div>
            <h1>Email for <br /> Developers & Creators</h1>
            <p className="landing-description">
              Email Alias gives you privacy-first disposable emails.  
              Keep your real inbox safe, filter spam, and stay in control.
            </p>
            <div className="landing-button">
              <a href="#docs" className="btn-get-started">Documentation &gt;</a>
              <button 
                className="btn-signing-main"
                onClick={() => setShowAuthDropdown(!showAuthDropdown)}
              >
                Get Started &gt;
              </button>
            </div>
          </div>
          <spline-viewer 
            className="robot-3d" 
            url="https://prod.spline.design/rdUxwCyuG9PozTJH/scene.splinecode"
            
          />
        </main>
      </div>

      {/* VALUE PROPOSITION */}
      <section id="features" className="section">
        <h2 className="section-title">Why InvisiMail?</h2>
        <div className="features-grid">
          <div className="feature-box">
            <h3>🛡 Privacy Protection</h3>
            <p>Use disposable aliases to hide your real email from spammers and trackers.</p>
          </div>
          <div className="feature-box">
            <h3>⚡ Instant Setup</h3>
            <p>Create aliases in seconds with a simple dashboard or API integration.</p>
          </div>
          <div className="feature-box">
            <h3>📂 Organized Inbox</h3>
            <p>Filter, forward, or block messages so you only see what matters.</p>
          </div>
        </div>
      </section>

      {/* TRUST / SOCIAL PROOF */}
      <section id="trust" className="section">
        <h2 className="section-title">Trusted by Developers</h2>
        <div className="trust-grid">
          <div className="trust-box">
            <p>&ldquo;Finally, I can sign up everywhere without worrying about spam.&rdquo;</p>
            <span>- Alex, Indie Hacker</span>
          </div>
          <div className="trust-box">
            <p>&ldquo;The API made it super easy to integrate aliases into my workflow.&rdquo;</p>
            <span>- Priya, Backend Dev</span>
          </div>
          <div className="trust-box">
            <p>&ldquo;Simple, fast, and secure. Exactly what I needed.&rdquo;</p>
            <span>- Mark, Freelancer</span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section">
        <h2 className="section-title">FAQs</h2>
        <div className="faq-grid">
          <div className="faq-box">
            <h3>Is it free?</h3>
            <p>Yes, InvisiMail has a free plan with essential features. Paid tiers unlock more aliases and filters.</p>
          </div>
          <div className="faq-box">
            <h3>How secure is it?</h3>
            <p>All aliases forward through encrypted channels. You stay fully anonymous.</p>
          </div>
          <div className="faq-box">
            <h3>Do I need to install anything?</h3>
            <p>No. Everything works from your browser dashboard or via API.</p>
          </div>
        </div>
      </section>

      {/* CTA / SIGNUP */}
      <section id="signup" className="section cta">
        <h2 className="section-title">Take control of your inbox today</h2>
        <button 
          className="btn-signing-main"
          onClick={() => setShowAuthDropdown(!showAuthDropdown)}
        >
          Create Free Alias
        </button>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <p>&copy; 2025 InvisiMail. All rights reserved.</p>
        <div className="footer-links">
          <a href="#">Privacy Policy</a> | 
          <a href="#">Terms</a> | 
          <a href="#">Contact</a>
        </div>
      </footer>
    </div>
  );
}