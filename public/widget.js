(function () {
  'use strict';

  // Get site ID from URL parameter or global config
  const urlParams = new URLSearchParams(window.location.search);
  const siteId = urlParams.get('id') || (window.accessWidget && window.accessWidget.id);

  if (!siteId) {
    console.warn('Accessibility Widget: No site ID provided');
    return;
  }

  // Prevent multiple instances
  if (window.accessibilityWidgetLoaded) {
    return;
  }
  window.accessibilityWidgetLoaded = true;

  // Widget state
  let widgetState = {
    isOpen: false,
    contrast: false,
    fontSizeLevel: 0,
    textSpacing: false,
    highlightLinks: false,
    pauseAnimations: false,
    hideImages: false,
    highlightFocus: false,
    tooltips: false,
    saturation: 'normal',
    textAlign: 'left',
    screenReader: false
  };

  // Modern CSS styles for widget
  const widgetStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    #accessibility-widget {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      direction: ltr;
    }

    #accessibility-toggle {
      width: 64px;
      height: 64px;
      border-radius: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      cursor: pointer;
      box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(10px);
      position: relative;
      overflow: hidden;
    }

    #accessibility-toggle::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%);
      border-radius: 20px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    #accessibility-toggle:hover {
      transform: translateY(-2px) scale(1.05);
      box-shadow: 0 12px 48px rgba(102, 126, 234, 0.4);
    }

    #accessibility-toggle:hover::before {
      opacity: 1;
    }

    #accessibility-toggle:active {
      transform: translateY(0) scale(0.98);
    }

    #accessibility-panel {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 380px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      box-shadow: 0 20px 80px rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.2);
      display: none;
      max-height: 580px;
      overflow: hidden;
      transform: translateY(20px) scale(0.95);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    #accessibility-panel.open {
      display: block;
      transform: translateY(0) scale(1);
      opacity: 1;
    }

    .widget-header {
      padding: 24px 24px 16px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 24px 24px 0 0;
      position: relative;
      overflow: hidden;
    }

    .widget-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
    }

    .widget-title {
      font-weight: 700;
      color: white;
      margin: 0;
      font-size: 18px;
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .widget-subtitle {
      color: rgba(255, 255, 255, 0.8);
      font-size: 13px;
      margin: 4px 0 0 0;
      position: relative;
      z-index: 1;
    }

    .widget-content {
      padding: 8px;
      max-height: 400px;
      overflow-y: auto;
    }

    .widget-content::-webkit-scrollbar {
      width: 6px;
    }

    .widget-content::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
      border-radius: 3px;
    }

    .widget-content::-webkit-scrollbar-thumb {
      background: rgba(102, 126, 234, 0.3);
      border-radius: 3px;
    }

    .widget-content::-webkit-scrollbar-thumb:hover {
      background: rgba(102, 126, 234, 0.5);
    }

    .widget-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      margin: 4px 0;
      border-radius: 16px;
      transition: all 0.2s ease;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .widget-option:hover {
      background: rgba(255, 255, 255, 0.9);
      transform: translateY(-1px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .widget-label {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #374151;
      font-weight: 500;
      font-size: 14px;
      flex: 1;
    }

    .widget-icon {
      font-size: 18px;
      width: 24px;
      text-align: center;
    }

    .widget-toggle {
      width: 52px;
      height: 28px;
      background: #e5e7eb;
      border-radius: 14px;
      position: relative;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 2px solid transparent;
    }

    .widget-toggle.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
    }

    .widget-toggle::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .widget-toggle.active::after {
      transform: translateX(24px);
    }

    .font-size-controls {
      display: flex;
      gap: 8px;
      align-items: center;
      background: rgba(255, 255, 255, 0.5);
      padding: 6px;
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }

    .font-size-btn {
      width: 36px;
      height: 36px;
      border: 1px solid rgba(102, 126, 234, 0.2);
      background: rgba(255, 255, 255, 0.8);
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: #667eea;
      transition: all 0.2s ease;
      font-size: 14px;
    }

    .font-size-btn:hover {
      background: #667eea;
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .font-size-display {
      font-size: 12px;
      color: #6b7280;
      min-width: 70px;
      text-align: center;
      font-weight: 500;
      padding: 0 8px;
    }

    .saturation-controls, .text-align-controls {
      display: flex;
      gap: 6px;
      background: rgba(255, 255, 255, 0.5);
      padding: 6px;
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }

    .control-btn {
      padding: 8px 12px;
      border: 1px solid rgba(102, 126, 234, 0.2);
      background: rgba(255, 255, 255, 0.8);
      border-radius: 8px;
      cursor: pointer;
      font-size: 12px;
      color: #667eea;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .control-btn.active {
      background: #667eea;
      color: white;
      border-color: #667eea;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    }

    .control-btn:hover:not(.active) {
      background: rgba(102, 126, 234, 0.1);
      transform: translateY(-1px);
    }

    /* Fixed Accessibility Enhancement Styles */
    .accessibility-contrast {
      filter: contrast(150%) brightness(1.1) !important;
    }

    .accessibility-highlight-links a {
      background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%) !important;
      outline: 2px solid #f59e0b !important;
      outline-offset: 2px !important;
      border-radius: 4px !important;
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3) !important;
      transition: all 0.2s ease !important;
    }

    .accessibility-highlight-links a:hover {
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%) !important;
      transform: translateY(-1px) !important;
    }

    .accessibility-large-text,
    .accessibility-large-text * {
      font-size: 1.2em !important;
      line-height: 1.6 !important;
    }

    .accessibility-extra-large-text,
    .accessibility-extra-large-text * {
      font-size: 1.4em !important;
      line-height: 1.7 !important;
    }

    .accessibility-huge-text,
    .accessibility-huge-text * {
      font-size: 1.6em !important;
      line-height: 1.8 !important;
    }

    .accessibility-text-spacing,
    .accessibility-text-spacing * {
      line-height: 2 !important;
      letter-spacing: 0.12em !important;
      word-spacing: 0.25em !important;
      margin-bottom: 0.5em !important;
    }

    .accessibility-pause-animations,
    .accessibility-pause-animations *,
    .accessibility-pause-animations *::before,
    .accessibility-pause-animations *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      transition-delay: 0ms !important;
      scroll-behavior: auto !important;
      animation-play-state: paused !important;
    }

    .accessibility-hide-images img,
    .accessibility-hide-images picture,
    .accessibility-hide-images svg,
    .accessibility-hide-images canvas,
    .accessibility-hide-images video,
    .accessibility-hide-images [style*="background-image"],
    .accessibility-hide-images .bg-image {
      opacity: 0 !important;
      visibility: hidden !important;
    }

    .accessibility-highlight-focus *:focus,
    .accessibility-highlight-focus *:focus-visible {
      outline: 4px solid #3b82f6 !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.3) !important;
      border-radius: 4px !important;
    }

    .accessibility-large-cursor,
    .accessibility-large-cursor * {
      cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M2 2l8 20 4-8 8-4z" fill="black"/><path d="M2 2l8 20 4-8 8-4z" fill="white" stroke="black" stroke-width="1"/></svg>') 2 2, auto !important;
    }

    .accessibility-grayscale,
    .accessibility-grayscale * {
      filter: grayscale(100%) !important;
    }

    .accessibility-saturated,
    .accessibility-saturated * {
      filter: saturate(200%) hue-rotate(15deg) !important;
    }

    .accessibility-text-left,
    .accessibility-text-left * {
      text-align: left !important;
    }

    .accessibility-text-center,
    .accessibility-text-center * {
      text-align: center !important;
    }

    .accessibility-text-right,
    .accessibility-text-right * {
      text-align: right !important;
    }

    .accessibility-tooltip {
      position: relative;
    }

    .accessibility-tooltip::after {
      content: attr(aria-label);
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
      color: white;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 12px;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 1000000;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      margin-bottom: 8px;
    }

    .accessibility-tooltip::before {
      content: '';
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 6px solid transparent;
      border-top-color: #1f2937;
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 1000000;
      margin-bottom: 2px;
    }

    .accessibility-tooltip:hover::after,
    .accessibility-tooltip:hover::before {
      opacity: 1;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      #accessibility-widget {
        bottom: 16px;
        right: 16px;
      }
      
      #accessibility-panel {
        width: calc(100vw - 32px);
        right: -16px;
        bottom: 90px;
      }
      
      #accessibility-toggle {
        width: 56px;
        height: 56px;
        border-radius: 16px;
        font-size: 24px;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      #accessibility-panel {
        background: rgba(31, 41, 55, 0.95);
        border: 1px solid rgba(75, 85, 99, 0.3);
      }
      
      .widget-option {
        background: rgba(55, 65, 81, 0.7);
        border: 1px solid rgba(75, 85, 99, 0.3);
      }
      
      .widget-option:hover {
        background: rgba(55, 65, 81, 0.9);
      }
      
      .widget-label {
        color: #e5e7eb;
      }
      
      .widget-toggle {
        background: #4b5563;
      }
      
      .control-btn, .font-size-btn {
        background: rgba(55, 65, 81, 0.8);
        border: 1px solid rgba(75, 85, 99, 0.3);
        color: #e5e7eb;
      }
      
      .control-btn:hover:not(.active), .font-size-btn:hover {
        background: rgba(102, 126, 234, 0.2);
      }
    }
  `;

  // Create and inject styles
  function injectStyles() {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = widgetStyles;
    document.head.appendChild(styleSheet);
  }

  // Create modern widget HTML
  function createWidget() {
    const widget = document.createElement('div');
    widget.id = 'accessibility-widget';
    widget.innerHTML = `
      <div id="accessibility-panel">
        <div class="widget-header">
          <h3 class="widget-title">
            <span>⚡</span>
            <span>Accessibility Hub</span>
          </h3>
          <p class="widget-subtitle">Customize your browsing experience</p>
        </div>
        <div class="widget-content">
          <div class="widget-option">
            <div class="widget-label">
              <span class="widget-icon">🔳</span>
              <span>High Contrast</span>
            </div>
            <div class="widget-toggle" data-feature="contrast"></div>
          </div>
          
          <div class="widget-option">
            <div class="widget-label">
              <span class="widget-icon">📢</span>
              <span>Screen Reader</span>
            </div>
            <div class="widget-toggle" data-feature="screenReader"></div>
          </div>
          
          <div class="widget-option">
            <div class="widget-label">
              <span class="widget-icon">🔗</span>
              <span>Highlight Links</span>
            </div>
            <div class="widget-toggle" data-feature="highlightLinks"></div>
          </div>
          
          <div class="widget-option">
            <div class="widget-label">
              <span class="widget-icon">🔠</span>
              <span>Font Size</span>
            </div>
            <div class="font-size-controls">
              <button class="font-size-btn" data-action="decrease">A−</button>
              <div class="font-size-display">Normal</div>
              <button class="font-size-btn" data-action="increase">A+</button>
            </div>
          </div>
          
          <div class="widget-option">
            <div class="widget-label">
              <span class="widget-icon">📏</span>
              <span>Text Spacing</span>
            </div>
            <div class="widget-toggle" data-feature="textSpacing"></div>
          </div>
          
          <div class="widget-option">
            <div class="widget-label">
              <span class="widget-icon">⏸️</span>
              <span>Pause Animations</span>
            </div>
            <div class="widget-toggle" data-feature="pauseAnimations"></div>
          </div>
          
          <div class="widget-option">
            <div class="widget-label">
              <span class="widget-icon">🖼️</span>
              <span>Hide Images</span>
            </div>
            <div class="widget-toggle" data-feature="hideImages"></div>
          </div>
          
          <div class="widget-option">
            <div class="widget-label">
              <span class="widget-icon">🎯</span>
              <span>Focus Highlight</span>
            </div>
            <div class="widget-toggle" data-feature="highlightFocus"></div>
          </div>
          
          <div class="widget-option">
            <div class="widget-label">
              <span class="widget-icon">💬</span>
              <span>Smart Tooltips</span>
            </div>
            <div class="widget-toggle" data-feature="tooltips"></div>
          </div>
          
          <div class="widget-option">
            <div class="widget-label">
              <span class="widget-icon">🎨</span>
              <span>Color Mode</span>
            </div>
            <div class="saturation-controls">
              <button class="control-btn active" data-saturation="normal">Normal</button>
              <button class="control-btn" data-saturation="grayscale">Grayscale</button>
              <button class="control-btn" data-saturation="saturated">Vivid</button>
            </div>
          </div>
          
          <div class="widget-option">
            <div class="widget-label">
              <span class="widget-icon">📄</span>
              <span>Text Align</span>
            </div>
            <div class="text-align-controls">
              <button class="control-btn active" data-align="left">Left</button>
              <button class="control-btn" data-align="center">Center</button>
              <button class="control-btn" data-align="right">Right</button>
            </div>
          </div>
        </div>
      </div>
      <button id="accessibility-toggle" aria-label="Open Accessibility Tools">
        ♿
      </button>
    `;

    document.body.appendChild(widget);
  }

  // Toggle panel visibility with improved animation
  function togglePanel() {
    console.log('🔄 togglePanel called, current state:', widgetState.isOpen);

    const panel = document.getElementById('accessibility-panel');
    const toggle = document.getElementById('accessibility-toggle');

    console.log('🔍 Panel element:', !!panel);
    console.log('🔍 Toggle element:', !!toggle);

    if (!panel || !toggle) {
      console.error('❌ Panel or toggle element not found!', { panel: !!panel, toggle: !!toggle });
      return;
    }

    widgetState.isOpen = !widgetState.isOpen;
    console.log('🔄 New state:', widgetState.isOpen);

    if (widgetState.isOpen) {
      console.log('📖 Opening panel...');
      panel.style.display = 'block';
      // Force a reflow
      panel.offsetHeight;
      panel.classList.add('open');
      toggle.setAttribute('aria-label', 'Close Accessibility Tools');
      console.log('✅ Panel opened');
    } else {
      console.log('📕 Closing panel...');
      panel.classList.remove('open');
      setTimeout(() => {
        if (!widgetState.isOpen) {
          panel.style.display = 'none';
          console.log('✅ Panel closed');
        }
      }, 300);
      toggle.setAttribute('aria-label', 'Open Accessibility Tools');
    }
  }

  // Enhanced feature application with better targeting
  function applyFeature(feature, enabled) {
    const body = document.body;
    const html = document.documentElement;

    // Remove existing classes
    const classMap = {
      'contrast': 'accessibility-contrast',
      'highlightLinks': 'accessibility-highlight-links',
      'textSpacing': 'accessibility-text-spacing',
      'pauseAnimations': 'accessibility-pause-animations',
      'hideImages': 'accessibility-hide-images',
      'highlightFocus': 'accessibility-highlight-focus',
      'tooltips': 'accessibility-tooltips',
      'screenReader': 'accessibility-screen-reader'
    };

    const className = classMap[feature];
    if (className) {
      if (enabled) {
        body.classList.add(className);
        html.classList.add(className);
      } else {
        body.classList.remove(className);
        html.classList.remove(className);
      }
    }

    // Special handling for specific features
    switch (feature) {
      case 'screenReader':
        enhanceScreenReaderSupport(enabled);
        break;
      case 'tooltips':
        toggleTooltips(enabled);
        break;
      case 'pauseAnimations':
        pauseAnimations(enabled);
        break;
      case 'hideImages':
        hideImages(enabled);
        break;
      case 'highlightFocus':
        highlightFocus(enabled);
        break;
    }
  }

  // Text-to-Speech Screen Reader functionality
  let speechSynthesis = null;
  let isReadingEnabled = false;
  let currentUtterance = null;
  let readingElements = new Set();

  function initializeSpeech() {
    if ('speechSynthesis' in window) {
      speechSynthesis = window.speechSynthesis;
      return true;
    }
    console.warn('Speech Synthesis not supported in this browser');
    return false;
  }

  function speakText(text, options = {}) {
    if (!speechSynthesis || !text || !text.trim()) return;

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    // Clean up text
    const cleanText = text.replace(/\s+/g, ' ').trim();
    if (cleanText.length === 0) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Configure speech settings
    utterance.rate = options.rate || 0.9;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 0.8;

    // Try to use a good voice
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice =>
      voice.lang.startsWith('en') &&
      (voice.name.includes('Natural') || voice.name.includes('Enhanced') || voice.default)
    ) || voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    currentUtterance = utterance;
    speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    if (speechSynthesis) {
      speechSynthesis.cancel();
      currentUtterance = null;
    }
  }

  function getElementText(element) {
    // Get text content based on element type
    if (element.tagName === 'IMG') {
      return element.alt || element.title || 'Image';
    } else if (element.tagName === 'INPUT') {
      return element.placeholder || element.value || `${element.type} input field`;
    } else if (element.tagName === 'BUTTON') {
      return element.textContent.trim() || element.title || 'Button';
    } else if (element.tagName === 'A') {
      return element.textContent.trim() || element.title || 'Link';
    } else if (element.tagName === 'SELECT') {
      const selectedOption = element.options[element.selectedIndex];
      return `Select menu: ${selectedOption ? selectedOption.textContent : 'no selection'}`;
    } else if (element.tagName === 'TEXTAREA') {
      return element.value || element.placeholder || 'Text area';
    } else {
      // For regular text elements
      let text = element.textContent || element.innerText || '';

      // If the element has child elements, try to get only direct text
      if (element.children.length > 0) {
        const directText = Array.from(element.childNodes)
          .filter(node => node.nodeType === Node.TEXT_NODE)
          .map(node => node.textContent.trim())
          .join(' ')
          .trim();

        if (directText) {
          text = directText;
        }
      }

      return text.trim();
    }
  }

  function addScreenReaderListeners(element) {
    if (readingElements.has(element)) return;

    const mouseEnterHandler = () => {
      if (!isReadingEnabled) return;

      const text = getElementText(element);
      if (text && text.length > 0 && text.length < 500) { // Limit length to avoid very long texts
        speakText(text);
      }
    };

    const mouseLeaveHandler = () => {
      if (!isReadingEnabled) return;
      // Don't stop immediately, let short texts finish
      setTimeout(() => {
        if (currentUtterance && currentUtterance.text.length < 50) {
          // Let short texts finish
        } else {
          stopSpeaking();
        }
      }, 100);
    };

    const clickHandler = () => {
      if (!isReadingEnabled) return;
      const text = getElementText(element);
      if (text) {
        speakText(`Clicked: ${text}`);
      }
    };

    element.addEventListener('mouseenter', mouseEnterHandler);
    element.addEventListener('mouseleave', mouseLeaveHandler);
    element.addEventListener('click', clickHandler);

    // Store handlers for cleanup
    element._screenReaderHandlers = {
      mouseenter: mouseEnterHandler,
      mouseleave: mouseLeaveHandler,
      click: clickHandler
    };

    readingElements.add(element);
  }

  function removeScreenReaderListeners(element) {
    if (!readingElements.has(element) || !element._screenReaderHandlers) return;

    const handlers = element._screenReaderHandlers;
    element.removeEventListener('mouseenter', handlers.mouseenter);
    element.removeEventListener('mouseleave', handlers.mouseleave);
    element.removeEventListener('click', handlers.click);

    delete element._screenReaderHandlers;
    readingElements.delete(element);
  }

  function enhanceScreenReaderSupport(enabled) {
    if (!initializeSpeech() && enabled) {
      console.warn('Speech synthesis not available');
      return;
    }

    isReadingEnabled = enabled;

    if (enabled) {
      // Add text-to-speech to readable elements
      const readableElements = document.querySelectorAll(`
        h1, h2, h3, h4, h5, h6,
        p, span, div, a, button,
        input, textarea, select, option,
        label, legend, caption,
        li, td, th,
        img[alt], img[title],
        [title], [aria-label],
        blockquote, pre, code
      `);

      readableElements.forEach(element => {
        // Skip if element is inside the accessibility widget
        if (element.closest('#accessibility-widget')) return;

        // Skip if element has no meaningful text
        const text = getElementText(element);
        if (!text || text.length < 2) return;

        addScreenReaderListeners(element);
      });

      // Add ARIA enhancements
      const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"], img, [tabindex]');
      interactiveElements.forEach(el => {
        // Add missing ARIA labels
        if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) {
          if (el.tagName === 'IMG' && !el.getAttribute('alt')) {
            el.setAttribute('aria-label', 'Image');
          } else if (el.textContent && el.textContent.trim()) {
            el.setAttribute('aria-label', el.textContent.trim());
          } else {
            el.setAttribute('aria-label', `${el.tagName.toLowerCase()} element`);
          }
        }

        // Add role attributes where missing
        if (el.tagName === 'BUTTON' && !el.getAttribute('role')) {
          el.setAttribute('role', 'button');
        }

        // Make sure interactive elements are keyboard accessible
        if (['DIV', 'SPAN'].includes(el.tagName) && el.onclick && !el.getAttribute('tabindex')) {
          el.setAttribute('tabindex', '0');
          el.setAttribute('role', 'button');
        }
      });

      // Announce that screen reader is enabled
      setTimeout(() => {
        speakText('Screen reader enabled. Hover over text to hear it read aloud.', { rate: 1.1 });
      }, 500);

    } else {
      // Remove all listeners and stop speaking
      stopSpeaking();

      readingElements.forEach(element => {
        removeScreenReaderListeners(element);
      });
      readingElements.clear();

      // Announce that screen reader is disabled
      setTimeout(() => {
        speakText('Screen reader disabled.', { rate: 1.1 });
      }, 100);
    }
  }

  // Enhanced tooltip functionality
  function toggleTooltips(enabled) {
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [tabindex]');

    interactiveElements.forEach(el => {
      if (enabled) {
        if (!el.classList.contains('accessibility-tooltip')) {
          el.classList.add('accessibility-tooltip');
          if (!el.getAttribute('aria-label')) {
            const text = el.textContent?.trim() || el.value || el.placeholder || el.title || el.tagName.toLowerCase();
            el.setAttribute('aria-label', text);
          }
        }
      } else {
        el.classList.remove('accessibility-tooltip');
      }
    });
  }

  // Enhanced animation pausing
  function pauseAnimations(enabled) {
    const body = document.body;
    const html = document.documentElement;

    if (enabled) {
      body.classList.add('accessibility-pause-animations');
      html.classList.add('accessibility-pause-animations');

      // Also pause CSS animations and transitions
      const style = document.createElement('style');
      style.id = 'accessibility-pause-animations-style';
      style.textContent = `
              *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                transition-delay: 0ms !important;
                animation-play-state: paused !important;
              }
            `;
      document.head.appendChild(style);
    } else {
      body.classList.remove('accessibility-pause-animations');
      html.classList.remove('accessibility-pause-animations');

      const pauseStyle = document.getElementById('accessibility-pause-animations-style');
      if (pauseStyle) {
        pauseStyle.remove();
      }
    }
  }

  // Enhanced image hiding
  function hideImages(enabled) {
    const body = document.body;
    const html = document.documentElement;

    if (enabled) {
      body.classList.add('accessibility-hide-images');
      html.classList.add('accessibility-hide-images');

      // Also hide background images
      const style = document.createElement('style');
      style.id = 'accessibility-hide-images-style';
      style.textContent = `
              img, picture, svg, canvas, video, embed, object, iframe,
              [style*="background-image"],
              [class*="bg-"],
              [class*="background"] {
                opacity: 0 !important;
                visibility: hidden !important;
              }
            `;
      document.head.appendChild(style);
    } else {
      body.classList.remove('accessibility-hide-images');
      html.classList.remove('accessibility-hide-images');

      const hideStyle = document.getElementById('accessibility-hide-images-style');
      if (hideStyle) {
        hideStyle.remove();
      }
    }
  }

  // Enhanced focus highlighting
  function highlightFocus(enabled) {
    const body = document.body;
    const html = document.documentElement;

    if (enabled) {
      body.classList.add('accessibility-highlight-focus');
      html.classList.add('accessibility-highlight-focus');

      const style = document.createElement('style');
      style.id = 'accessibility-highlight-focus-style';
      style.textContent = `
              *:focus, *:focus-visible, *:focus-within {
                outline: 4px solid #3b82f6 !important;
                outline-offset: 2px !important;
                box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.3) !important;
                border-radius: 4px !important;
              }
            `;
      document.head.appendChild(style);
    } else {
      body.classList.remove('accessibility-highlight-focus');
      html.classList.remove('accessibility-highlight-focus');

      const focusStyle = document.getElementById('accessibility-highlight-focus-style');
      if (focusStyle) {
        focusStyle.remove();
      }
    }
  }

  // Enhanced font size changes
  function changeFontSize(action) {
    const body = document.body;
    const html = document.documentElement;
    const currentClasses = ['accessibility-large-text', 'accessibility-extra-large-text', 'accessibility-huge-text'];

    // Remove existing font size classes
    currentClasses.forEach(cls => {
      body.classList.remove(cls);
      html.classList.remove(cls);
    });

    if (action === 'increase') {
      widgetState.fontSizeLevel = Math.min(widgetState.fontSizeLevel + 1, 3);
    } else if (action === 'decrease') {
      widgetState.fontSizeLevel = Math.max(widgetState.fontSizeLevel - 1, 0);
    }

    // Apply new font size class
    if (widgetState.fontSizeLevel > 0) {
      const className = currentClasses[widgetState.fontSizeLevel - 1];
      body.classList.add(className);
      html.classList.add(className);
    }

    // Update display
    const display = document.querySelector('.font-size-display');
    const levels = ['Normal', 'Large', 'Extra Large', 'Huge'];
    if (display) {
      display.textContent = levels[widgetState.fontSizeLevel];
    }
  }

  // Enhanced saturation changes
  function changeSaturation(level) {
    const body = document.body;
    const html = document.documentElement;

    body.classList.remove('accessibility-grayscale', 'accessibility-saturated');
    html.classList.remove('accessibility-grayscale', 'accessibility-saturated');

    if (level === 'grayscale') {
      body.classList.add('accessibility-grayscale');
      html.classList.add('accessibility-grayscale');
    } else if (level === 'saturated') {
      body.classList.add('accessibility-saturated');
      html.classList.add('accessibility-saturated');
    }

    widgetState.saturation = level;

    // Update button states
    document.querySelectorAll('[data-saturation]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.saturation === level);
    });
  }

  // Enhanced text alignment changes
  function changeTextAlign(align) {
    const body = document.body;
    const html = document.documentElement;

    body.classList.remove('accessibility-text-left', 'accessibility-text-center', 'accessibility-text-right');
    html.classList.remove('accessibility-text-left', 'accessibility-text-center', 'accessibility-text-right');

    body.classList.add(`accessibility-text-${align}`);
    html.classList.add(`accessibility-text-${align}`);

    widgetState.textAlign = align;

    // Update button states
    document.querySelectorAll('[data-align]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.align === align);
    });
  }

  // Enhanced event listeners
  function attachEventListeners() {
    // Toggle button with improved interaction
    const toggleBtn = document.getElementById('accessibility-toggle');
    if (!toggleBtn) {
      console.error('❌ Toggle button not found!');
      return;
    }

    console.log('🔗 Attaching click handler to toggle button...');
    toggleBtn.addEventListener('click', function (e) {
      console.log('🖱️ Toggle button clicked!', e);
      togglePanel();
    });

    // Keyboard support for toggle
    toggleBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        togglePanel();
      }
    });

    // Feature toggles
    document.querySelectorAll('.widget-toggle').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const feature = toggle.dataset.feature;
        widgetState[feature] = !widgetState[feature];
        toggle.classList.toggle('active', widgetState[feature]);
        applyFeature(feature, widgetState[feature]);
      });

      // Keyboard support
      toggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle.click();
        }
      });

      // Make focusable
      toggle.setAttribute('tabindex', '0');
      toggle.setAttribute('role', 'switch');
    });

    // Font size controls
    document.querySelectorAll('.font-size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        changeFontSize(btn.dataset.action);
      });
    });

    // Saturation controls
    document.querySelectorAll('[data-saturation]').forEach(btn => {
      btn.addEventListener('click', () => {
        changeSaturation(btn.dataset.saturation);
      });
    });

    // Text alignment controls
    document.querySelectorAll('[data-align]').forEach(btn => {
      btn.addEventListener('click', () => {
        changeTextAlign(btn.dataset.align);
      });
    });

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
      const widget = document.getElementById('accessibility-widget');
      if (!widget.contains(e.target) && widgetState.isOpen) {
        togglePanel();
      }
    });

    // Escape key to close panel
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && widgetState.isOpen) {
        togglePanel();
      }
    });
  }

  // Initialize widget with enhanced loading and debugging
  function init() {
    console.log('🔄 Initializing Accessibility Widget...');
    console.log('📍 Document ready state:', document.readyState);
    console.log('🆔 Site ID:', siteId);

    // Check if widget already exists
    if (document.getElementById('accessibility-widget')) {
      console.log('⚠️ Widget already exists, skipping initialization');
      return;
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      console.log('⏳ DOM still loading, waiting for DOMContentLoaded...');
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    try {
      console.log('🎨 Injecting styles...');
      injectStyles();

      console.log('🏗️ Creating widget...');
      createWidget();

      console.log('🔗 Attaching event listeners...');
      attachEventListeners();

      // Verify widget was created
      const widget = document.getElementById('accessibility-widget');
      const toggleBtn = document.getElementById('accessibility-toggle');

      if (widget && toggleBtn) {
        console.log('✅ Widget elements created successfully');
        console.log('🎯 Toggle button found:', toggleBtn);

        // Test click handler
        toggleBtn.addEventListener('click', function (e) {
          console.log('🖱️ Toggle button clicked!', e);
        });

      } else {
        console.error('❌ Widget elements not found:', { widget, toggleBtn });
      }

      // Add a small delay to ensure styles are applied
      setTimeout(() => {
        console.log('✅ Accessibility Widget loaded successfully for site:', siteId);

        // Final verification
        const finalWidget = document.getElementById('accessibility-widget');
        const finalToggle = document.getElementById('accessibility-toggle');
        console.log('🔍 Final check - Widget:', !!finalWidget, 'Toggle:', !!finalToggle);

      }, 100);

    } catch (error) {
      console.error('❌ Error loading Accessibility Widget:', error);
      console.error('📊 Error stack:', error.stack);
    }
  }

  // Next.js compatible initialization
  function safeInit() {
    console.log('🚀 Starting Accessibility Widget initialization...');
    console.log('📍 Current URL:', window.location.href);
    console.log('📍 Document ready state:', document.readyState);

    // Strategy 1: Immediate if DOM is ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      console.log('📋 DOM is ready, initializing immediately...');
      setTimeout(init, 100); // Small delay for Next.js hydration
    }
    // Strategy 2: Wait for DOMContentLoaded
    else if (document.readyState === 'loading') {
      console.log('⏳ DOM loading, waiting for DOMContentLoaded...');
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(init, 100);
      });
    }

    // Strategy 3: Fallback with window.onload
    window.addEventListener('load', function () {
      console.log('🔄 Window loaded, checking if widget exists...');
      setTimeout(() => {
        if (!document.getElementById('accessibility-widget')) {
          console.log('🔧 Widget not found, reinitializing...');
          init();
        }
      }, 200);
    });

    // Strategy 4: Next.js specific - wait for hydration
    if (typeof window !== 'undefined') {
      // Check if Next.js is present
      if (window.next || window.__NEXT_DATA__) {
        console.log('🔍 Next.js detected, using hydration-safe initialization...');

        // Wait for Next.js hydration
        const checkHydration = () => {
          if (document.body && document.body.children.length > 0) {
            console.log('💧 Next.js appears hydrated, initializing widget...');
            if (!document.getElementById('accessibility-widget')) {
              init();
            }
          } else {
            setTimeout(checkHydration, 100);
          }
        };

        setTimeout(checkHydration, 500);
      }
    }

    // Strategy 5: Timeout fallback
    setTimeout(() => {
      if (!document.getElementById('accessibility-widget')) {
        console.log('⏰ Timeout fallback, attempting to initialize...');
        init();
      }
    }, 2000);
  }

  // Start initialization with Next.js compatibility
  safeInit();

})(); 