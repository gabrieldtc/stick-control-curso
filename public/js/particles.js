/**
 * MEDIEVAL — Particle System
 * Golden dust particles floating like embers in a torchlit hall
 * Extra density near hero/banner area + burst effect for chapter completion
 */
(function() {
  const canvas = document.createElement('canvas');
  canvas.id = 'particles-canvas';
  document.body.prepend(canvas);
  
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animationId;
  let pulseIntensity = 0;
  
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  class Particle {
    constructor(zone) {
      this.zone = zone || 'ambient';
      this.reset();
    }
    
    reset() {
      if (this.zone === 'hero') {
        // Concentrated near the top 40% of the viewport
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height * 0.4;
        this.size = Math.random() * 3.5 + 1.5;
        this.speedX = (Math.random() - 0.5) * 0.2;
        this.speedY = -Math.random() * 0.3 - 0.05;
        this.opacity = Math.random() * 0.7 + 0.3;
      } else {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = -Math.random() * 0.4 - 0.1;
        this.opacity = Math.random() * 0.6 + 0.2;
      }
      
      const palettes = [
        { h: 42, s: 70, l: 60 },
        { h: 38, s: 75, l: 55 },
        { h: 35, s: 65, l: 50 },
        { h: 30, s: 55, l: 45 },
        { h: 45, s: 60, l: 65 },
        { h: 40, s: 80, l: 50 },
      ];
      const p = palettes[Math.floor(Math.random() * palettes.length)];
      this.hue = p.h;
      this.sat = p.s;
      this.lit = p.l;
      
      this.pulse = 0;
      this.flicker = Math.random() * Math.PI * 2;
    }
    
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.pulse *= 0.95;
      this.flicker += 0.02;
      
      if (this.y < -10) {
        if (this.zone === 'hero') {
          this.y = canvas.height * 0.4 + 10;
        } else {
          this.y = canvas.height + 10;
        }
        this.x = Math.random() * canvas.width;
      }
      if (this.x < -10) this.x = canvas.width + 10;
      if (this.x > canvas.width + 10) this.x = -10;
    }
    
    draw() {
      const flickerAlpha = 0.8 + Math.sin(this.flicker) * 0.2;
      const size = this.size + this.pulse * 4 + pulseIntensity * 3;
      const alpha = (this.opacity + this.pulse * 0.4) * flickerAlpha;
      
      ctx.beginPath();
      ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue}, ${this.sat}%, ${this.lit}%, ${alpha})`;
      ctx.fill();
      
      if (size > 1.0) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, ${this.sat}%, ${this.lit}%, ${alpha * 0.15})`;
        ctx.fill();
      }
    }
  }
  
  function init() {
    resize();
    particles = [];
    
    // Hero zone: ~40 particles concentrated in top 40%
    const heroCount = Math.min(40, Math.floor((canvas.width * canvas.height * 0.4) / 12000));
    for (let i = 0; i < heroCount; i++) {
      particles.push(new Particle('hero'));
    }
    
    // Ambient zone: rest spread across the whole page
    const ambientCount = Math.min(60, Math.floor((canvas.width * canvas.height) / 18000));
    for (let i = 0; i < ambientCount; i++) {
      particles.push(new Particle('ambient'));
    }
  }
  
  function connectParticles() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 140) {
          const alpha = (1 - dist / 140) * 0.1;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(201, 168, 76, ${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
  }
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    
    connectParticles();
    
    pulseIntensity *= 0.98;
    
    animationId = requestAnimationFrame(animate);
  }
  
  // Audio-reactive pulse
  window.addEventListener('neuralPulse', (e) => {
    pulseIntensity = Math.min(1, (e.detail?.intensity || 0.5));
    particles.forEach(p => {
      p.pulse = Math.min(1, p.pulse + 0.3);
    });
  });
  
  // Chapter completion burst
  window.triggerBurst = function(x, y, count) {
    count = count || 40;
    const colors = ['#c9a84c', '#e0c878', '#8a7234', '#d4a843', '#f0d878'];
    
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'burst-particle';
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.background = colors[Math.floor(Math.random() * colors.length)];
      el.style.width = (Math.random() * 6 + 3) + 'px';
      el.style.height = el.style.width;
      
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const dist = 80 + Math.random() * 200;
      el.style.setProperty('--bx', Math.cos(angle) * dist + 'px');
      el.style.setProperty('--by', Math.sin(angle) * dist - 60 + 'px');
      el.style.animationDuration = (0.8 + Math.random() * 0.6) + 's';
      
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1400);
    }
    
    // Flash overlay
    const flash = document.createElement('div');
    flash.className = 'complete-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 900);
  };
  
  // Initialize
  init();
  animate();
  
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      init();
    }, 200);
  });
  
  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(animationId);
  });
})();
