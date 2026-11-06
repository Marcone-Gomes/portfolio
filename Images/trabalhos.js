(() => {
  // Lightbox Modal for Trabalhos Gallery
  const lightbox = document.getElementById('works-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxCategory = document.getElementById('lightbox-category');
  const lightboxClose = document.querySelector('.lightbox-close');
  const lightboxOverlay = document.querySelector('.lightbox-overlay');
  const projectCards = document.querySelectorAll('.project-card');

  let lastActiveElement = null;

  function openLightbox(src, title, category, triggerElement) {
    if (!lightbox || !lightboxImg) return;
    lastActiveElement = triggerElement || document.activeElement;

    lightboxImg.src = src;
    lightboxImg.alt = title;
    if (lightboxTitle) lightboxTitle.textContent = title;
    if (lightboxCategory) lightboxCategory.textContent = category;

    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (lightboxClose) {
      lightboxClose.focus();
    }
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
      lastActiveElement.focus();
    }
  }

  projectCards.forEach(card => {
    // Click trigger
    card.addEventListener('click', () => {
      const src = card.getAttribute('data-src') || card.querySelector('img')?.getAttribute('src');
      const title = card.getAttribute('data-title') || card.querySelector('.project-title')?.textContent || '';
      const category = card.getAttribute('data-category') || card.querySelector('.project-category')?.textContent || '';
      if (src) {
        openLightbox(src, title, category, card);
      }
    });

    // Keyboard trigger (Enter or Space)
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const src = card.getAttribute('data-src') || card.querySelector('img')?.getAttribute('src');
        const title = card.getAttribute('data-title') || card.querySelector('.project-title')?.textContent || '';
        const category = card.getAttribute('data-category') || card.querySelector('.project-category')?.textContent || '';
        if (src) {
          openLightbox(src, title, category, card);
        }
      }
    });
  });

  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }
  if (lightboxOverlay) {
    lightboxOverlay.addEventListener('click', closeLightbox);
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });
})();

