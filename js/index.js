document.addEventListener("DOMContentLoaded", function () {
  // Mobile menu toggle
  const menuBtn = document.getElementById("menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
      
      // Toggle hamburger icon
      const icon = menuBtn.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
      }
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (event) => {
      if (!mobileMenu.classList.contains('hidden')) {
        if (!mobileMenu.contains(event.target) && !menuBtn.contains(event.target)) {
          mobileMenu.classList.add('hidden');
          
          // Reset hamburger icon
          const icon = menuBtn.querySelector('i');
          if (icon) {
            icon.classList.add('fa-bars');
            icon.classList.remove('fa-times');
          }
        }
      }
    });
  }

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#' || href === '#!') return;

      e.preventDefault();
      const target = document.querySelector(href);
      
      if (target) {
        // Close mobile menu if open
        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
          mobileMenu.classList.add('hidden');
          if (menuBtn) {
            const icon = menuBtn.querySelector('i');
            if (icon) {
              icon.classList.add('fa-bars');
              icon.classList.remove('fa-times');
            }
          }
        }

        // Smooth scroll to target
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

        // Update URL without page reload
        history.pushState(null, null, href);
      }
    });
  });

  // Scroll animations for sections
  const sections = document.querySelectorAll("section[id]");

  if (sections.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-fadeIn");
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '-50px 0px'
    });

    sections.forEach(section => {
      observer.observe(section);
    });
  }

  // Contact form handling
  const contactForm = document.querySelector('#contact form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form data
      const formData = new FormData(this);
      const submitBtn = this.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      
      // Simulate form submission
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sending...';
      
      // Simulate API call
      setTimeout(() => {
        // Show success message
        const successDiv = document.createElement('div');
        successDiv.className = 'mt-4 p-4 bg-green-100 text-green-700 rounded-lg animate-fadeIn';
        successDiv.innerHTML = `
          <div class="flex items-center">
            <i class="fas fa-check-circle mr-3"></i>
            <div>
              <p class="font-semibold">Message sent successfully!</p>
              <p class="text-sm mt-1">We'll get back to you within 24 hours.</p>
            </div>
          </div>
        `;
        
        this.appendChild(successDiv);
        this.reset();
        
        // Reset button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        
        // Remove success message after 5 seconds
        setTimeout(() => {
          successDiv.remove();
        }, 5000);
      }, 1500);
    });
  }

  // Add floating animation to energy orb
  const energyOrb = document.querySelector('.energy-orb');
  if (energyOrb) {
    energyOrb.style.animation = 'float 4s ease-in-out infinite';
  }

  // Update live stats counter
  function updateStatsCounter() {
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
      const target = parseInt(counter.getAttribute('data-target') || counter.textContent.replace(/[^0-9]/g, ''));
      const speed = 200; // Animation speed
      let current = 0;
      
      const updateCount = () => {
        const increment = target / speed;
        if (current < target) {
          current += increment;
          counter.textContent = Math.ceil(current) + (counter.textContent.includes('+') ? '+' : '');
          setTimeout(updateCount, 10);
        } else {
          counter.textContent = target + (counter.textContent.includes('+') ? '+' : '');
        }
      };
      
      updateCount();
    });
  }

  // Start counter animation when stats section is in view
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        updateStatsCounter();
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  const statsSection = document.querySelector('#overview');
  if (statsSection) {
    statsObserver.observe(statsSection);
  }

  // Add hover effect to feature cards
  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-10px)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
    });
  });
});

// Add CSS animation keyframes if not already present
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.8s ease-out forwards;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-15px); }
  }
`;
document.head.appendChild(style);

// Handle window resize
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    // Close mobile menu on desktop
    if (window.innerWidth >= 768) {
      const mobileMenu = document.getElementById('mobile-menu');
      const menuBtn = document.getElementById('menu-btn');
      
      if (mobileMenu && menuBtn) {
        mobileMenu.classList.add('hidden');
        
        const icon = menuBtn.querySelector('i');
        if (icon) {
          icon.classList.add('fa-bars');
          icon.classList.remove('fa-times');
        }
      }
    }
  }, 250);
});