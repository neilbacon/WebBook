// script.js - Interactive Photo Book logic

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const book = document.getElementById('book');
  const sheets = Array.from(document.querySelectorAll('.sheet'));
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const pageScrubber = document.getElementById('page-scrubber');
  const currentSpreadIndicator = document.getElementById('current-spread');
  const playBtn = document.getElementById('play-btn');
  const playIcon = document.getElementById('play-icon');
  const playText = document.getElementById('play-text');
  const soundBtn = document.getElementById('sound-btn');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.querySelector('.lightbox-close');

  // Book State
  let currentSheet = 0;
  const totalSheets = sheets.length; // 9 sheets
  let autoplayInterval = null;
  let isAutoplayActive = false;
  let isSoundEnabled = true;

  // Web Audio Context for Synthesizing Page Flip Sound
  let audioCtx = null;

  // Set up sheets interaction
  sheets.forEach((sheet, idx) => {
    // Add page-turn shading overlays dynamically
    const frontFace = sheet.querySelector('.page-face.front');
    const backFace = sheet.querySelector('.page-face.back');
    
    const frontShading = document.createElement('div');
    frontShading.className = 'sheet-shading';
    frontFace.appendChild(frontShading);
    
    const backShading = document.createElement('div');
    backShading.className = 'sheet-shading';
    backFace.appendChild(backShading);

    // Clicking on right page turns it forward, left page turns it back
    frontFace.addEventListener('click', (e) => {
      // If clicking a photo or button, don't trigger flip
      if (e.target.closest('.photo-frame') || e.target.closest('button')) return;
      if (idx === currentSheet) {
        nextPage();
      }
    });

    backFace.addEventListener('click', (e) => {
      if (e.target.closest('.photo-frame') || e.target.closest('button')) return;
      if (idx === currentSheet - 1) {
        prevPage();
      }
    });
  });

  // Lightbox Zoom Trigger
  document.querySelectorAll('.photo-frame').forEach(frame => {
    frame.addEventListener('click', () => {
      const img = frame.querySelector('.photo-img');
      const caption = frame.nextElementSibling;
      
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      
      // Copy caption titles and description into lightbox
      const title = caption.querySelector('h3').textContent;
      const meta = caption.querySelector('.meta').textContent;
      const desc = caption.querySelector('.desc').textContent;
      
      lightboxCaption.innerHTML = `
        <h3>${title}</h3>
        <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent-gold); margin-bottom: 8px;">${meta}</p>
        <p style="font-size: 14px; color: var(--text-light); opacity: 0.8; line-height: 1.6;">${desc}</p>
      `;
      
      lightbox.classList.add('show');
      
      // Pause autoplay when zooming
      if (isAutoplayActive) {
        toggleAutoplay();
      }
    });
  });

  // Close Lightbox
  lightboxClose.addEventListener('click', () => {
    lightbox.classList.remove('show');
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox-close')) {
      lightbox.classList.remove('show');
    }
  });

  // Synthesize Page-Flip Sound Effect using Web Audio API
  function playFlipSound() {
    if (!isSoundEnabled) return;
    
    try {
      // Initialize context on first click/flip
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      
      const bufferSize = audioCtx.sampleRate * 0.4; // 400ms duration
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      
      // Fill buffer with white noise
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noiseNode = audioCtx.createBufferSource();
      noiseNode.buffer = buffer;
      
      // Filter noise to sound like rubbing paper (swoosh)
      const filterNode = audioCtx.createBiquadFilter();
      filterNode.type = 'bandpass';
      filterNode.Q.setValueAtTime(1.5, audioCtx.currentTime);
      
      // Modulate the filter frequency to simulate movement
      filterNode.frequency.setValueAtTime(2500, audioCtx.currentTime);
      filterNode.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.35);
      
      const gainNode = audioCtx.createGain();
      
      // Amplitude envelope
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.38);
      
      noiseNode.connect(filterNode);
      filterNode.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      noiseNode.start();
      noiseNode.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn("Web Audio page-flip synthesis failed:", e);
    }
  }

  // Update book classes and alignment
  function updateBookState() {
    // 1. Shift book hinge centering
    if (currentSheet === 0) {
      // Book is closed (Cover showing on the right)
      book.classList.remove('open');
      book.style.transform = 'translateX(0)';
    } else if (currentSheet === totalSheets) {
      // Book is closed (Back Cover showing on the left)
      book.classList.remove('open');
      book.style.transform = `translateX(0)`;
    } else {
      // Book is open (Left and Right pages showing)
      book.classList.add('open');
      book.style.transform = `translateX(${560 / 2}px)`; // Align spine center
    }

    // 2. Flip sheets and adjust z-indices
    sheets.forEach((sheet, idx) => {
      // Manage active interactions on current visible pages
      if (idx === currentSheet || idx === currentSheet - 1) {
        sheet.classList.add('active');
      } else {
        sheet.classList.remove('active');
      }

      if (idx < currentSheet) {
        sheet.classList.add('flipped');
        sheet.style.zIndex = idx + 1;
      } else {
        sheet.classList.remove('flipped');
        sheet.style.zIndex = totalSheets - idx;
      }
    });

    // 3. Set custom properties for page thickness stacks
    const leftStackThickness = currentSheet * 1.5;
    const rightStackThickness = (totalSheets - currentSheet) * 1.5;
    document.documentElement.style.setProperty('--left-stack', `${leftStackThickness}px`);
    document.documentElement.style.setProperty('--right-stack', `${rightStackThickness}px`);

    // 4. Update spread label indicator
    if (currentSheet === 0) {
      currentSpreadIndicator.textContent = "Cover";
    } else if (currentSheet === totalSheets) {
      currentSpreadIndicator.textContent = "Back Cover";
    } else {
      currentSpreadIndicator.textContent = `Spread ${currentSheet} of ${totalSheets - 1}`;
    }

    // 5. Update scrubber position
    pageScrubber.value = currentSheet;

    // 6. Manage navigation button states
    prevBtn.disabled = currentSheet === 0;
    nextBtn.disabled = currentSheet === totalSheets;
  }

  // Turn page Forward
  function nextPage() {
    if (currentSheet < totalSheets) {
      const activeSheet = sheets[currentSheet];
      activeSheet.classList.add('flipping');
      playFlipSound();
      
      currentSheet++;
      updateBookState();
      
      setTimeout(() => {
        activeSheet.classList.remove('flipping');
      }, 1200);
    }
  }

  // Turn page Backward
  function prevPage() {
    if (currentSheet > 0) {
      currentSheet--;
      const activeSheet = sheets[currentSheet];
      activeSheet.classList.add('flipping');
      playFlipSound();
      
      updateBookState();
      
      setTimeout(() => {
        activeSheet.classList.remove('flipping');
      }, 1200);
    }
  }

  // Scrubber slide handler
  pageScrubber.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    if (val !== currentSheet) {
      playFlipSound();
      currentSheet = val;
      updateBookState();
    }
  });

  // Autoplay Slideshow
  function toggleAutoplay() {
    if (isAutoplayActive) {
      clearInterval(autoplayInterval);
      autoplayInterval = null;
      isAutoplayActive = false;
      playText.textContent = "Autoplay";
      // Restore Play Icon
      playIcon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"></polygon>`;
    } else {
      isAutoplayActive = true;
      playText.textContent = "Pause";
      // Change to Pause Icon
      playIcon.innerHTML = `<line x1="6" y1="4" x2="6" y2="20" stroke-width="2"></line><line x1="18" y1="4" x2="18" y2="20" stroke-width="2"></line>`;
      
      autoplayInterval = setInterval(() => {
        if (currentSheet < totalSheets) {
          nextPage();
        } else {
          // Reset to cover when back cover reached
          currentSheet = 0;
          playFlipSound();
          updateBookState();
        }
      }, 5500);
    }
  }

  playBtn.addEventListener('click', toggleAutoplay);

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (lightbox.classList.contains('show')) {
      if (e.key === 'Escape') {
        lightbox.classList.remove('show');
      }
      return;
    }
    
    if (e.key === 'ArrowRight' || e.key === ' ') {
      nextPage();
    } else if (e.key === 'ArrowLeft') {
      prevPage();
    }
  });

  // Buttons click handlers
  nextBtn.addEventListener('click', nextPage);
  prevBtn.addEventListener('click', prevPage);

  // Sound control
  soundBtn.addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
    if (isSoundEnabled) {
      soundBtn.style.color = 'var(--text-light)';
      soundBtn.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      soundBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
      `;
    } else {
      soundBtn.style.color = 'var(--text-muted)';
      soundBtn.style.borderColor = 'rgba(255, 255, 255, 0.03)';
      soundBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <line x1="23" y1="9" x2="17" y2="15"></line>
          <line x1="17" y1="9" x2="23" y2="15"></line>
        </svg>
      `;
    }
  });

  // Fullscreen toggle
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  });

  // Responsive book scaling wrapper
  function scaleBook() {
    const bookWrapper = document.querySelector('.book-wrapper');
    const viewportHeight = document.querySelector('.viewport').clientHeight - 60;
    const viewportWidth = document.querySelector('.viewport').clientWidth - 60;
    
    // Size of fully opened book (two pages wide)
    const bookWidth = 1120 + 80; // 560px * 2 + margins
    const bookHeight = 720 + 80;
    
    const scaleX = viewportWidth / bookWidth;
    const scaleY = viewportHeight / bookHeight;
    
    let scale = Math.min(scaleX, scaleY);
    
    // Limit maximum scale to 1.15 to avoid pixelation
    scale = Math.min(Math.max(scale, 0.3), 1.15);
    
    bookWrapper.style.transform = `scale(${scale})`;
  }

  // Adjust book scale on load and resize
  window.addEventListener('resize', scaleBook);
  setTimeout(scaleBook, 100);

  // Initialize
  updateBookState();
});
