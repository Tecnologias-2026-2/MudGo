/* ============================================================
   MudGo — Global JavaScript
   Interactividad: formularios, tabs, navegación suave, modales
   ============================================================ */

'use strict';

// ─── DOM Ready ───
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollAnimations();
  initTabs();
  initFAQ();
  initModals();
  initForms();
  initSmoothScroll();
});

// ─── Navbar scroll effect ───
function initNavbar() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;

  const onScroll = () => {
    if (window.scrollY > 40) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile toggle
  const toggle = document.getElementById('nav-toggle');
  const links  = document.getElementById('nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
    });
  }
}

// ─── Scroll-triggered animations ───
function initScrollAnimations() {
  const elements = document.querySelectorAll('.animate-on-scroll');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.style.animationDelay || '0s';
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, parseFloat(delay) * 1000);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
}

// ─── Tabs ───
function initTabs() {
  document.querySelectorAll('[data-tabs]').forEach(container => {
    const buttons = container.querySelectorAll('[data-tab]');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab');
        const group  = btn.closest('[data-tabs]');

        // Update buttons
        group.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update panels
        const panelContainer = document.querySelector(`[data-tab-panels="${group.getAttribute('data-tabs')}"]`);
        if (panelContainer) {
          panelContainer.querySelectorAll('[data-panel]').forEach(p => {
            p.classList.toggle('hidden', p.getAttribute('data-panel') !== target);
          });
        }

        // Trigger custom event for tab-specific logic
        container.dispatchEvent(new CustomEvent('tabchange', { detail: { tab: target } }));
      });
    });
  });

  // Login/Register role tabs
  const roleTabs = document.querySelectorAll('.role-tab');
  roleTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      roleTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      handleRoleTabChange(tab.getAttribute('data-role'));
    });
  });
}

function handleRoleTabChange(role) {
  // Show/hide provider-specific fields
  const providerFields = document.querySelectorAll('.provider-only');
  providerFields.forEach(el => {
    el.classList.toggle('hidden', role !== 'proveedor');
  });
}

// ─── FAQ Accordion ───
function initFAQ() {
  // Global toggle function
}

window.toggleFaq = function(id) {
  const item = document.getElementById(id);
  if (!item) return;

  const isOpen = item.classList.contains('open');

  // Close all
  document.querySelectorAll('.faq-item.open').forEach(el => {
    if (el !== item) el.classList.remove('open');
  });

  // Toggle current
  item.classList.toggle('open', !isOpen);
};

// ─── Modals ───
function initModals() {
  // Open modal
  document.querySelectorAll('[data-modal-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-modal-open');
      openModal(modalId);
    });
  });

  // Close modal (overlay click or close button)
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-modal-close') || btn.closest('.modal-overlay').id;
      closeModal(modalId);
    });
  });

  // ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(m => closeModal(m.id));
    }
  });
}

window.openModal = function(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
};

window.closeModal = function(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('open');
    document.body.style.overflow = '';
  }
};

// ─── Forms ───
function initForms() {
  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const activeTab = loginForm.querySelector('.role-tab.active');
      const role = activeTab ? activeTab.getAttribute('data-role') : 'cliente';

      const btn = loginForm.querySelector('[type="submit"]');
      setLoading(btn, true);

      setTimeout(() => {
        setLoading(btn, false);
        if (role === 'cliente') {
          window.location.href = 'dashboard-cliente.html';
        } else if (role === 'proveedor') {
          window.location.href = 'dashboard-proveedor.html';
        } else if (role === 'admin') {
          window.location.href = 'admin-dashboard.html';
        }
      }, 1200);
    });
  }

  // Register form
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = registerForm.querySelector('[type="submit"]');
      setLoading(btn, true);
      setTimeout(() => {
        setLoading(btn, false);
        showToast('¡Cuenta creada exitosamente! Bienvenido a MudGo.', 'success');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
      }, 1400);
    });
  }

  // Solicitar mudanza form (step form)
  const stepForm = document.getElementById('step-form');
  if (stepForm) {
    initStepForm(stepForm);
  }

  // Payment form
  const paymentForm = document.getElementById('payment-form');
  if (paymentForm) {
    paymentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = paymentForm.querySelector('[type="submit"]');
      setLoading(btn, true);
      setTimeout(() => {
        setLoading(btn, false);
        window.location.href = 'confirmacion-pago.html';
      }, 1800);
    });
  }

  // Generic forms with loading
  document.querySelectorAll('form[data-redirect]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const redirect = form.getAttribute('data-redirect');
      const btn = form.querySelector('[type="submit"]');
      if (btn) setLoading(btn, true);
      setTimeout(() => {
        window.location.href = redirect;
      }, 1000);
    });
  });
}

// ─── Step Form ───
function initStepForm(form) {
  let currentStep = 1;
  const totalSteps = parseInt(form.getAttribute('data-steps') || '4');

  function showStep(n) {
    form.querySelectorAll('[data-step]').forEach(el => {
      el.classList.toggle('hidden', parseInt(el.getAttribute('data-step')) !== n);
    });

    // Update step indicators
    document.querySelectorAll('.step-circle').forEach((circle, i) => {
      const stepNum = i + 1;
      circle.classList.toggle('active', stepNum === n);
      circle.classList.toggle('done', stepNum < n);
    });
    document.querySelectorAll('.step-label').forEach((label, i) => {
      const stepNum = i + 1;
      label.classList.toggle('active', stepNum === n);
      label.classList.toggle('done', stepNum < n);
    });
    document.querySelectorAll('.step-line').forEach((line, i) => {
      line.classList.toggle('done', i + 1 < n);
    });

    currentStep = n;
  }

  window.nextStep = function() {
    if (currentStep < totalSteps) showStep(currentStep + 1);
  };
  window.prevStep = function() {
    if (currentStep > 1) showStep(currentStep - 1);
  };

  showStep(1);
}

// ─── Smooth Scroll ───
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

// ─── Loading Button ───
function setLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn.setAttribute('data-original-text', btn.innerHTML);
    btn.innerHTML = `<svg class="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="60" stroke-dashoffset="20"/></svg> Cargando...`;
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.getAttribute('data-original-text') || 'Enviar';
    btn.disabled = false;
  }
}

// ─── Toast Notifications ───
function showToast(message, type = 'info') {
  const colors = {
    success: { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' },
    error:   { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
    info:    { bg: '#E6F0FF', color: '#0052CC', border: '#B3CFFF' },
    warning: { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
  };
  const c = colors[type] || colors.info;

  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    background: ${c.bg}; color: ${c.color}; border: 1px solid ${c.border};
    padding: 0.875rem 1.25rem; border-radius: 12px;
    font-size: 0.875rem; font-weight: 600; font-family: 'Inter', sans-serif;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    transform: translateY(20px); opacity: 0;
    transition: all 0.3s ease;
    max-width: 360px;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  });

  setTimeout(() => {
    toast.style.transform = 'translateY(20px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

window.showToast = showToast;

// ─── Sidebar active link highlighting ───
(function() {
  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
})();

// ─── Service Request Tabs (on provider dashboard) ───
window.filterRequests = function(status) {
  const cards = document.querySelectorAll('[data-request-status]');
  cards.forEach(card => {
    const s = card.getAttribute('data-request-status');
    if (status === 'todas' || s === status) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });

  document.querySelectorAll('[data-filter-btn]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-filter-btn') === status);
  });
};

// ─── Reject Modal ───
window.showRejectModal = function(requestId) {
  const modal = document.getElementById('reject-modal');
  if (modal) {
    document.getElementById('reject-request-id').textContent = requestId;
    openModal('reject-modal');
  }
};

window.confirmReject = function() {
  closeModal('reject-modal');
  showToast('Solicitud rechazada correctamente.', 'warning');
  setTimeout(() => location.reload(), 1000);
};

// ─── Accept Request ───
window.acceptRequest = function(requestId) {
  showToast('¡Solicitud aceptada! El cliente será notificado.', 'success');
  setTimeout(() => {
    window.location.href = 'solicitud-aceptada.html';
  }, 1200);
};

// ─── Format currency ───
window.formatCurrency = function(amount) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);
};

// ─── Number counter animation ───
function animateCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseFloat(el.getAttribute('data-count'));
    const suffix = el.getAttribute('data-suffix') || '';
    const prefix = el.getAttribute('data-prefix') || '';
    const duration = 1500;
    const start = performance.now();

    function update(time) {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);
      el.textContent = prefix + current.toLocaleString('es-CO') + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  });
}

// Run counter animation when stats are visible
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounters();
      counterObserver.disconnect();
    }
  });
}, { threshold: 0.3 });

const statsSection = document.querySelector('.hero-stats, .stat-cards');
if (statsSection) counterObserver.observe(statsSection);
