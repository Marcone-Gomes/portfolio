(() => {
  const TOTAL_FRAMES = 300;
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const loader = document.getElementById('loader');
  const loaderBar = document.getElementById('loader-bar');

  // Image cache
  const images = new Array(TOTAL_FRAMES);
  let loadedCount = 0;
  let isLoaderHidden = false;

  // Animation interpolation state
  let targetFrame = 0;
  let currentFrame = 0;
  let lastDrawnIndex = -1;

  // Frame URL pattern: Bruno/ezgif-frame-001.jpg ... Bruno/ezgif-frame-300.jpg
  function getFrameUrl(index) {
    const frameNum = String(index + 1).padStart(3, '0');
    return `Bruno/ezgif-frame-${frameNum}.jpg`;
  }

  // Adjust canvas size to match viewport with retina/High-DPI resolution
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);

    if (lastDrawnIndex >= 0) {
      drawFrame(lastDrawnIndex, true);
    }
  }

  // Render a specific frame with responsive "cover" scaling
  function drawFrame(index, force = false) {
    if (index < 0) index = 0;
    if (index >= TOTAL_FRAMES) index = TOTAL_FRAMES - 1;
    if (index === lastDrawnIndex && !force) return;

    let img = images[index];

    // If frame is still loading during quick scrub, use the nearest loaded one
    if (!img || !img.complete || img.naturalWidth === 0) {
      img = findNearestLoadedImage(index);
      if (!img) return;
    }

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    if (!cw || !ch || !iw || !ih) return;

    // Aspect-ratio cover math
    const scale = Math.max(cw / iw, ch / ih);
    const drawWidth = iw * scale;
    const drawHeight = ih * scale;
    const offsetX = (cw - drawWidth) * 0.5;
    const offsetY = (ch - drawHeight) * 0.5;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#0b0c10';
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, 0, 0, iw, ih, offsetX, offsetY, drawWidth, drawHeight);

    lastDrawnIndex = index;
  }

  // Fallback to nearest loaded frame for zero-flicker scrubbing
  function findNearestLoadedImage(index) {
    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      const prev = index - offset;
      if (prev >= 0 && images[prev] && images[prev].complete && images[prev].naturalWidth > 0) {
        return images[prev];
      }
      const next = index + offset;
      if (next < TOTAL_FRAMES && images[next] && images[next].complete && images[next].naturalWidth > 0) {
        return images[next];
      }
    }
    return null;
  }

  // Calculate current scroll progress and target frame across all sections
  function onScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const maxScroll = Math.max(
      (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight,
      1
    );
    const progress = Math.min(Math.max(scrollTop / maxScroll, 0), 1);
    targetFrame = progress * (TOTAL_FRAMES - 1);

    updateActiveNav();
  }

  // Update loading bar progress
  function updateLoadingProgress() {
    const pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);
    if (loaderBar) {
      loaderBar.style.width = pct + '%';
    }

    if (loadedCount >= TOTAL_FRAMES && !isLoaderHidden) {
      isLoaderHidden = true;
      if (loader) {
        loader.classList.add('loaded');
      }
    }
  }

  // Preload all frames immediately
  function preloadImages() {
    // 1. Load frame 0 first for instant initial paint
    const firstImg = new Image();
    firstImg.src = getFrameUrl(0);
    images[0] = firstImg;

    const onFirstLoad = () => {
      loadedCount++;
      updateLoadingProgress();
      drawFrame(0, true);
    };

    if (firstImg.complete) {
      onFirstLoad();
    } else {
      firstImg.onload = onFirstLoad;
      firstImg.onerror = onFirstLoad;
    }

    // 2. Preload remaining 299 frames
    for (let i = 1; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFrameUrl(i);
      images[i] = img;

      img.onload = () => {
        loadedCount++;
        updateLoadingProgress();
      };
      img.onerror = () => {
        loadedCount++;
        updateLoadingProgress();
      };
    }
  }

  // Smooth LERP (Linear Interpolation) loop for buttery frame transitions
  const LERP_SPEED = 0.085; // Butter-smooth easing factor
  function renderLoop() {
    const delta = targetFrame - currentFrame;

    if (Math.abs(delta) > 0.001) {
      currentFrame += delta * LERP_SPEED;
    } else {
      currentFrame = targetFrame;
    }

    const frameToDraw = Math.round(currentFrame);
    drawFrame(frameToDraw);

    requestAnimationFrame(renderLoop);
  }

  // Navigation active state tracker
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');
  
  function updateActiveNav() {
    const scrollPos = (window.pageYOffset || document.documentElement.scrollTop) + 200;
    
    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      const id = sec.getAttribute('id');
      
      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
            if (!link.querySelector('.nav-dot')) {
              const dot = document.createElement('span');
              dot.className = 'nav-dot';
              link.appendChild(dot);
            }
          } else {
            link.classList.remove('active');
            const dot = link.querySelector('.nav-dot');
            if (dot) dot.remove();
          }
        });
      }
    });
  }

  // Works Lightbox Modal logic
  const lightbox = document.getElementById('works-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxCategory = document.getElementById('lightbox-category');
  const lightboxClose = document.querySelector('.lightbox-close');
  const lightboxOverlay = document.querySelector('.lightbox-overlay');
  const projectCards = document.querySelectorAll('.project-card');

  function openLightbox(src, title, category) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.alt = title;
    if (lightboxTitle) lightboxTitle.textContent = title;
    if (lightboxCategory) lightboxCategory.textContent = category;
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  projectCards.forEach(card => {
    card.addEventListener('click', () => {
      const src = card.getAttribute('data-src') || card.querySelector('img')?.getAttribute('src');
      const title = card.getAttribute('data-title') || card.querySelector('.project-title')?.textContent || '';
      const category = card.getAttribute('data-category') || card.querySelector('.project-category')?.textContent || '';
      if (src) {
        openLightbox(src, title, category);
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

  // Event Listeners
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    resizeCanvas();
    onScroll();
  }, { passive: true });

  // Initialize
  resizeCanvas();
  onScroll();
  preloadImages();
  requestAnimationFrame(renderLoop);
})();
