<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>About Us - Yantrika Robotics Club</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

  <style>
    /* General Styles */
    :root {
      --primary-color: #ff453a;
      --secondary-color: #00d4ff;
      --background-color: #0f0f13;
      --card-background: #1a1a1f;
      --text-color: #e0e0e0;
      --subtle-text: #a0aec0;
      --border-color: rgba(255, 255, 255, 0.1);
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', sans-serif;
      background-color: var(--background-color);
      color: var(--text-color);
      line-height: 1.6;
      overflow-x: hidden;
    }

    /* Navbar Styles */
    .navbar {
      position: fixed;
      top: 0;
      width: 100%;
      background: transparent;
      padding: 1.2rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 1000;
      transition: background-color 0.3s ease, backdrop-filter 0.3s ease;
    }

    .navbar.scrolled {
      background-color: rgba(15, 15, 19, 0.8);
      backdrop-filter: blur(10px);
    }

    .logo-home {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #fff;
      font-weight: 700;
      font-size: 1.4rem;
      text-decoration: none;
      transition: all 0.3s ease;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    }

    .logo-home:hover {
      color: var(--primary-color);
      transform: translateY(-2px);
    }

    .logo-home img {
      height: 45px;
      width: auto;
      transition: transform 0.3s ease;
    }
    .logo-home:hover img {
        transform: scale(1.05) rotate(5deg);
    }

    .nav-controls {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .menu-dropdown {
      position: relative;
    }

    .menu-btn {
      background: rgba(26, 26, 31, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid var(--border-color);
      color: #fff;
      padding: 0.8rem 1.2rem;
      border-radius: 25px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.8rem;
      font-weight: 500;
      font-size: 1rem;
      transition: all 0.3s ease;
    }

    .menu-btn:hover {
      background: rgba(255, 69, 58, 0.1);
      border-color: rgba(255, 69, 58, 0.3);
      color: var(--primary-color);
    }

    .menu-arrow {
      transition: transform 0.3s ease;
    }

    .menu-btn:hover .menu-arrow {
      transform: rotate(180deg);
    }

    .dropdown-content {
      position: absolute;
      top: calc(100% + 15px);
      right: 0;
      min-width: 200px;
      background: rgba(26, 26, 31, 0.95);
      backdrop-filter: blur(15px);
      border: 1px solid var(--border-color);
      border-radius: 15px;
      padding: 1rem 0;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px);
      transition: all 0.3s ease;
    }

    .menu-dropdown:hover .dropdown-content {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .dropdown-content a {
      display: block;
      color: #fff;
      text-decoration: none;
      padding: 0.8rem 1.5rem;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .dropdown-content a:hover,
    .dropdown-content a.active {
      color: var(--primary-color);
      background-color: rgba(255, 255, 255, 0.05);
      transform: translateX(5px);
    }

    .start-btn {
      background: linear-gradient(135deg, var(--primary-color), #ff6b6b);
      border: none;
      color: #fff;
      padding: 0.8rem 1.5rem;
      border-radius: 25px;
      font-weight: 600;
      transition: all 0.3s ease;
      text-decoration: none;
    }

    .start-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(255, 69, 58, 0.4);
    }
    
    /* Hero Section */
    .hero {
        text-align: center;
        padding: 12rem 2rem 6rem;
        background: linear-gradient(180deg, rgba(15, 15, 19, 0) 0%, var(--background-color) 100%), url('https://images.unsplash.com/photo-1518314916381-77a37c2a49ae?q=80&w=2071&auto=format&fit=crop') no-repeat center center/cover;
    }
    
    .hero h1 {
        font-size: 3.5rem;
        font-weight: 700;
        margin-bottom: 1rem;
    }
    
    .hero .highlight {
        color: var(--primary-color);
    }
    
    /* General Section Styling */
    section {
        padding: 5rem 2rem;
    }
    
    .section-header {
        text-align: center;
        margin-bottom: 3rem;
    }
    
    .section-subtitle {
        color: var(--primary-color);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    
    .section-header h2 {
        font-size: 2.5rem;
        margin-top: 0.5rem;
    }

    /* --- SCROLL ANIMATION STYLES --- */
    .reveal {
      opacity: 0;
      transform: translateY(50px);
      transition: opacity 0.8s ease, transform 0.8s ease;
    }
    .reveal.visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* Services Grid */
    .services-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
        max-width: 1200px;
        margin: 0 auto;
    }
    
    .service-card {
        background: var(--card-background);
        padding: 2rem;
        border-radius: 12px;
        border: 1px solid var(--border-color);
        transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
    }
    
    .service-card:hover {
        transform: translateY(-10px);
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
        border-color: var(--primary-color);
    }
    
    .service-card h3 {
        font-size: 1.5rem;
        margin-bottom: 1rem;
        color: var(--primary-color);
    }
    
    /* Faculty Section */
    .faculty-advisors-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .faculty-card {
      background: var(--card-background);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      overflow: hidden;
      text-align: center;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .faculty-card:hover {
        transform: translateY(-10px);
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
    }

    .faculty-image img {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      margin: 1.5rem auto 1rem;
      border: 3px solid var(--primary-color);
    }

    .faculty-info {
      padding: 0 1.5rem 1.5rem;
    }
    .faculty-info h3 {
        font-size: 1.4rem;
    }
    .faculty-designation {
        color: var(--primary-color);
        font-weight: 500;
    }
    .faculty-department {
        font-size: 0.9rem;
        color: var(--subtle-text);
        margin-bottom: 1rem;
    }
    .faculty-bio {
        font-size: 0.95rem;
        color: var(--subtle-text);
        margin-bottom: 1rem;
    }
    .faculty-contact a {
        color: var(--subtle-text);
        margin: 0 0.5rem;
        font-size: 1.2rem;
        transition: color 0.3s ease;
    }
    .faculty-contact a:hover {
        color: var(--primary-color);
    }
    
    /* Footer */
    .footer {
      background-color: #1a1a1f;
      padding: 4rem 2rem 2rem;
      border-top: 1px solid var(--border-color);
    }
    .footer-top {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 2rem;
      max-width: 1200px;
      margin: 0 auto 2rem;
    }
    .footer-logo {
      font-size: 1.8rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }
    .footer-column p, .footer-column a {
      color: var(--subtle-text);
      text-decoration: none;
    }
    .subscribe-link {
        display: inline-block;
        margin-top: 1rem;
        font-weight: 600;
        color: #fff !important;
        transition: color 0.3s ease;
    }
    .subscribe-link:hover {
        color: var(--primary-color) !important;
    }
    .footer-bottom {
      border-top: 1px solid var(--border-color);
      padding-top: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin-left: auto;
      margin-right: auto;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .footer-nav {
      list-style: none;
      display: flex;
      gap: 1.5rem;
    }
    .footer-nav li a {
      color: var(--subtle-text);
      font-weight: 500;
      transition: color 0.3s ease;
    }
    .footer-nav li a:hover,
    .footer-nav li a[aria-current="page"] {
      color: var(--primary-color);
    }
    .footer-social a {
      color: var(--subtle-text);
      font-size: 1.2rem;
      margin-left: 1.5rem;
      transition: color 0.3s ease;
    }
    .footer-social a:hover {
      color: var(--primary-color);
    }

  </style>
</head>
<body>

  <header class="navbar" role="banner">
    <a href="index.html" class="logo-home">
      <img src="yantrika.png" alt="Yantrika Logo" />
      <span><strong>Yantrika</strong></span>
    </a>
    
    <nav class="nav-controls" role="navigation" aria-label="Main Navigation">
      <div class="menu-dropdown">
        <button class="menu-btn" id="menu-button" aria-haspopup="true" aria-expanded="false" aria-controls="menu-dropdown">
          <span>Menu</span>
          <i class="menu-arrow fas fa-chevron-down"></i>
        </button>
        
        <div class="dropdown-content" id="menu-dropdown" role="menu" aria-labelledby="menu-button">
          <a href="index.html" role="menuitem">Home</a>
          <a href="about.html" class="active" role="menuitem" aria-current="page">About</a>
          <a href="team.html" role="menuitem">Team</a>
          <a href="projects.html" role="menuitem">Projects</a>
          <a href="events.html" role="menuitem">Events</a>
          <a href="gallery.html" role="menuitem">Gallery</a>
          <a href="contact.html" role="menuitem">Join & Contact</a>
          <a href="sponsors.html" role="menuitem">Sponsors</a>
        </div>
      </div>
      
      <a href="contact.html" class="start-btn">
        <i class="fas fa-rocket"></i> Join Now
      </a>
    </nav>
  </header>

  <main>
    <section class="hero">
      <div class="hero-content">
        <h1>About <span class="highlight">Yantrika</span></h1>
        <p>Discover our mission, vision, and the journey that drives us to innovate in robotics and automation.</p>
      </div>
    </section>

    <section class="services reveal">
      <div class="section-header">
        <span class="section-subtitle">Our Story</span>
        <h2>Mission & Vision</h2>
      </div>

      <div class="services-grid">
        <div class="service-card">
          <h3>Our Mission</h3>
          <p>To foster innovation in robotics by providing students with hands-on experience, cutting-edge resources, and opportunities to solve real-world problems through technology.</p>
        </div>

        <div class="service-card">
          <h3>Our Vision</h3>
          <p>To be the leading college robotics club that produces skilled engineers and innovators who will shape the future of automation and artificial intelligence.</p>
        </div>

        <div class="service-card">
          <h3>Our Values</h3>
          <p>Innovation, collaboration, excellence, and continuous learning drive everything we do. We believe in pushing boundaries and creating solutions that matter.</p>
        </div>
      </div>
    </section>

    <section class="faculty reveal">
      <div class="section-header">
        <span class="section-subtitle">Guidance</span>
        <h2>Faculty Advisors</h2>
      </div>

      <div class="faculty-advisors-grid">
        <div class="faculty-card">
          <div class="faculty-image">
            <img src="https://via.placeholder.com/150" alt="Dr. John Smith">
          </div>
          <div class="faculty-info">
            <h3>Dr. John Smith</h3>
            <p class="faculty-designation">Principal Faculty Advisor</p>
            <p class="faculty-department">Department of Computer Engineering</p>
            <p class="faculty-bio">Ph.D. in Robotics Engineering with 15+ years of experience in autonomous systems and AI.</p>
            <div class="faculty-contact">
              <a href="mailto:john.smith@college.edu"><i class="fas fa-envelope"></i></a>
              <a href="#" target="_blank"><i class="fab fa-linkedin"></i></a>
            </div>
          </div>
        </div>

        <div class="faculty-card">
          <div class="faculty-image">
            <img src="https://via.placeholder.com/150" alt="Dr. Sarah Johnson">
          </div>
          <div class="faculty-info">
            <h3>Dr. Sarah Johnson</h3>
            <p class="faculty-designation">Co-Faculty Advisor</p>
            <p class="faculty-department">Department of Mechanical Engineering</p>
            <p class="faculty-bio">Expert in robotics design and mechatronics. Passionate about hands-on learning.</p>
            <div class="faculty-contact">
              <a href="mailto:sarah.johnson@college.edu"><i class="fas fa-envelope"></i></a>
              <a href="#" target="_blank"><i class="fab fa-linkedin"></i></a>
            </div>
          </div>
        </div>

        <div class="faculty-card">
          <div class="faculty-image">
            <img src="https://via.placeholder.com/150" alt="Prof. Michael Wilson">
          </div>
          <div class="faculty-info">
            <h3>Prof. Michael Wilson</h3>
            <p class="faculty-designation">Technical Advisor</p>
            <p class="faculty-department">Department of Electronics Engineering</p>
            <p class="faculty-bio">Electronics and embedded systems specialist with expertise in IoT and sensor technologies.</p>
            <div class="faculty-contact">
              <a href="mailto:michael.wilson@college.edu"><i class="fas fa-envelope"></i></a>
              <a href="#" target="_blank"><i class="fab fa-linkedin"></i></a>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
  
  <footer class="footer" role="contentinfo">
    <div class="footer-top">
      <div class="footer-column">
        <h2 class="footer-logo">YANTRIKA</h2>
        <p>Empowering the next generation of roboticists and innovators.</p>
        <a href="join.html" class="subscribe-link">Join Our Club</a>
      </div>
      <div class="footer-column">
        <h3>Contact Info</h3>
        <address>
          Engineering Department<br />
          College Campus, Room 204<br />
          <a href="mailto:yantrika@college.edu">yantrika@college.edu</a><br />
          <a href="tel:+919876543210">+91 98765 43210</a>
        </address>
      </div>
    </div>
    <div class="footer-bottom">
      <ul class="footer-nav" role="list">
        <li><a href="index.html">Home</a></li>
        <li><a href="about.html" aria-current="page">About</a></li>
        <li><a href="projects.html">Projects</a></li>
        <li><a href="contact.html">Contact</a></li>
      </ul>
      <div class="footer-social" role="list" aria-label="Social media links">
        <a href="#" aria-label="LinkedIn" rel="noopener noreferrer" target="_blank"><i class="fab fa-linkedin-in"></i></a>
        <a href="#" aria-label="Instagram" rel="noopener noreferrer" target="_blank"><i class="fab fa-instagram"></i></a>
        <a href="#" aria-label="YouTube" rel="noopener noreferrer" target="_blank"><i class="fab fa-youtube"></i></a>
        <a href="#" aria-label="GitHub" rel="noopener noreferrer" target="_blank"><i class="fab fa-github"></i></a>
      </div>
    </div>
  </footer>

<script>
document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menu-button');
    const dropdown = document.getElementById('menu-dropdown');
    
    if (!menuBtn || !dropdown) return;
    
    const menuContainer = menuBtn.parentElement;

    // --- NAVBAR SCROLL EFFECT ---
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // --- SCROLL REVEAL ANIMATION ---
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { 
        threshold: 0.1
    });
    revealElements.forEach(el => revealObserver.observe(el));

    // --- MENU DROPDOWN LOGIC ---
    menuContainer.addEventListener('mouseenter', () => {
        menuBtn.setAttribute('aria-expanded', 'true');
    });

    menuContainer.addEventListener('mouseleave', () => {
        menuBtn.setAttribute('aria-expanded', 'false');
    });

    menuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
        menuBtn.setAttribute('aria-expanded', !isExpanded);
    });

    document.addEventListener('click', (e) => {
        if (!menuContainer.contains(e.target)) {
            menuBtn.setAttribute('aria-expanded', 'false');
        }
    });

    dropdown.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            menuBtn.setAttribute('aria-expanded', 'false');
            menuBtn.focus();
        }
    });
});
</script>
</body>
</html>