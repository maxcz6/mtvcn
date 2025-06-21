// Configuración global
const CONFIG = {
  scrollThreshold: 100,
  animationDuration: 600,
  counterSpeed: 20,
  observerThreshold: 0.1,
  observerMargin: '0px 0px -50px 0px'
};

// Utilidades
const utils = {
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  getElement(selector) {
    return document.querySelector(selector);
  },

  getElements(selector) {
    return document.querySelectorAll(selector);
  }
};

// Clase para manejar la navegación
class NavigationHandler {
  constructor() {
    this.navbar = utils.getElement('#navbar');
    this.navLinks = utils.getElement('.nav-links');
    this.init();
  }

  init() {
    this.setupScrollEffect();
    this.setupSmoothScroll();
  }

  setupScrollEffect() {
    if (!this.navbar) return;

    const handleScroll = utils.throttle(() => {
      const shouldAddScrolled = window.scrollY > CONFIG.scrollThreshold;
      this.navbar.classList.toggle('scrolled', shouldAddScrolled);
    }, 16); // ~60fps

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  setupSmoothScroll() {
    utils.getElements('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = anchor.getAttribute('href');
        const target = utils.getElement(targetId);
        
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          // Cerrar menú móvil si está abierto
          this.closeMenu();
        }
      });
    });
  }

  toggleMenu() {
    if (!this.navLinks) return;
    this.navLinks.classList.toggle('active');
  }

  closeMenu() {
    if (!this.navLinks) return;
    this.navLinks.classList.remove('active');
  }
}

// Clase para manejar tabs
class TabHandler {
  constructor() {
    this.init();
  }

  init() {
    // Auto-inicializar tabs si existen
    const tabButtons = utils.getElements('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabName = btn.getAttribute('data-tab');
        if (tabName) {
          this.openTab(e, tabName);
        }
      });
    });
  }

  openTab(evt, tabName) {
    // Remover clases activas de contenido
    utils.getElements('.tab-content').forEach(content => {
      content.classList.remove('active');
    });

    // Remover clases activas de botones
    utils.getElements('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    // Activar tab seleccionado
    const targetTab = utils.getElement(`#${tabName}`);
    if (targetTab) {
      targetTab.classList.add('active');
      evt.currentTarget.classList.add('active');
    }
  }
}

// Clase para manejar animaciones
class AnimationHandler {
  constructor() {
    this.observers = new Map();
    this.init();
  }

  init() {
    this.setupScrollAnimations();
    this.setupCounterAnimations();
  }

  setupScrollAnimations() {
    const options = {
      threshold: CONFIG.observerThreshold,
      rootMargin: CONFIG.observerMargin
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateElement(entry.target);
        }
      });
    }, options);

    // Preparar y observar elementos
    const elementsToAnimate = utils.getElements('.glass-card, .module, .job-card, [data-animate]');
    elementsToAnimate.forEach(el => {
      this.prepareElement(el);
      observer.observe(el);
    });

    this.observers.set('scroll', observer);
  }

  prepareElement(el) {
    const animationType = el.getAttribute('data-animate') || 'fadeInUp';
    
    switch (animationType) {
      case 'fadeInUp':
        Object.assign(el.style, {
          opacity: '0',
          transform: 'translateY(30px)',
          transition: `all ${CONFIG.animationDuration}ms ease-out`
        });
        break;
      case 'fadeInLeft':
        Object.assign(el.style, {
          opacity: '0',
          transform: 'translateX(-30px)',
          transition: `all ${CONFIG.animationDuration}ms ease-out`
        });
        break;
      case 'fadeInRight':
        Object.assign(el.style, {
          opacity: '0',
          transform: 'translateX(30px)',
          transition: `all ${CONFIG.animationDuration}ms ease-out`
        });
        break;
      default:
        Object.assign(el.style, {
          opacity: '0',
          transform: 'translateY(30px)',
          transition: `all ${CONFIG.animationDuration}ms ease-out`
        });
    }
  }

  animateElement(el) {
    requestAnimationFrame(() => {
      Object.assign(el.style, {
        opacity: '1',
        transform: 'translate(0, 0)'
      });
    });
  }

  setupCounterAnimations() {
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateCounters(entry.target);
          statsObserver.unobserve(entry.target);
        }
      });
    });

    const statsElements = utils.getElements('.stats, [data-stats]');
    statsElements.forEach(el => statsObserver.observe(el));
    
    this.observers.set('stats', statsObserver);
  }

  animateCounters(container) {
    const numbers = container.querySelectorAll('.stat-number, [data-counter]');
    numbers.forEach(num => {
      const target = parseInt(num.textContent) || parseInt(num.getAttribute('data-target'));
      if (!isNaN(target) && target > 0) {
        this.animateCounter(num, target);
      }
    });
  }

  animateCounter(el, target) {
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = parseInt(el.getAttribute('data-duration')) || 2000;
    const steps = Math.ceil(duration / CONFIG.counterSpeed);
    const increment = target / steps;
    
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(increment * step, target);
      
      el.textContent = Math.floor(current) + suffix;
      
      if (current >= target) {
        clearInterval(timer);
        el.textContent = target + suffix; // Asegurar valor final exacto
      }
    }, CONFIG.counterSpeed);
  }

  // Método para limpiar observers
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Clase principal de la aplicación
class App {
  constructor() {
    this.navigation = null;
    this.tabs = null;
    this.animations = null;
    this.init();
  }

  init() {
    // Esperar a que el DOM esté completamente cargado
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeModules());
    } else {
      this.initializeModules();
    }
  }

  initializeModules() {
    try {
      this.navigation = new NavigationHandler();
      this.tabs = new TabHandler();
      this.animations = new AnimationHandler();
      
      // Exponer métodos globales para compatibilidad
      this.exposeGlobalMethods();
      
      console.log('App initialized successfully');
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  }

  exposeGlobalMethods() {
    // Mantener compatibilidad con llamadas directas desde HTML
    window.toggleMenu = () => this.navigation?.toggleMenu();
    window.closeMenu = () => this.navigation?.closeMenu();
    window.openTab = (evt, tabName) => this.tabs?.openTab(evt, tabName);
  }

  // Método para cleanup cuando sea necesario
  destroy() {
    this.animations?.cleanup();
  }
}

// Inicializar la aplicación
const app = new App();

// Exponer app globalmente para debugging
if (typeof window !== 'undefined') {
  window.app = app;
}

