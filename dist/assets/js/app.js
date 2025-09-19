
// TFOT Labs Multilingual App
// Handles language detection, loading translations, updating content, and dynamic elements

const LANGUAGES = ['ru', 'en', 'zh', 'ja', 'fr', 'de', 'hi', 'it', 'es', 'ko', 'ar', 'he', 'sw', 'pt', 'tr', 'nl', 'da', 'no', 'sv', 'fi'];
const RTL_LANGUAGES = ['ar', 'he'];

const FLAGS = {
  'ru': '🇷🇺',
  'en': '🇺🇸 / 🇬🇧',
  'zh': '🇨🇳',
  'ja': '🇯🇵',
  'fr': '🇫🇷',
  'de': '🇩🇪',
  'hi': '🇮🇳',
  'it': '🇮🇹',
  'es': '🇪🇸',
  'ko': '🇰🇷',
  'ar': '🇸🇦',
  'he': '🇮🇱',
  'sw': '🇹🇿',
  'pt': '🇵🇹 / 🇧🇷',
  'tr': '🇹🇷',
  'nl': '🇳🇱',
  'da': '🇩🇰',
  'no': '🇳🇴',
  'sv': '🇸🇪',
  'fi': '🇫🇮'
};

const COUNTRY_FLAGS = {
  'RU': '🇷🇺', 'US': '🇺🇸', 'GB': '🇬🇧', 'CN': '🇨🇳', 'JP': '🇯🇵',
  'DE': '🇩🇪', 'TR': '🇹🇷', 'FR': '🇫🇷', 'IT': '🇮🇹', 'IN': '🇮🇳',
  'IL': '🇮🇱', 'SA': '🇸🇦', 'PT': '🇵🇹', 'BR': '🇧🇷', 'ES': '🇪🇸',
  'MX': '🇲🇽', 'AR': '🇦🇷', 'CL': '🇨🇱', 'PE': '🇵🇪',
  'NL': '🇳🇱', 'DK': '🇩🇰', 'NO': '🇳🇴', 'SE': '🇸🇪', 'FI': '🇫🇮',
  'TZ': '🇹🇿'
};

const REGION_FLAGS = {
  'ES': '🇪🇸', 'MX': '🇲🇽', 'AR': '🇦🇷', 'CL': '🇨🇱', 'PE': '🇵🇪',
  'PT': '🇵🇹', 'BR': '🇧🇷'
};

function getFlagFromCode(code) {
  return COUNTRY_FLAGS[code] || '🌍';
}

function getRegionName(code, lang) {
  if (translations.contact && translations.contact.regions && translations.contact.regions[code]) {
    return translations.contact.regions[code];
  }
  const names = {
    'ES': 'Spain', 'MX': 'Mexico', 'AR': 'Argentina', 'CL': 'Chile', 'PE': 'Peru',
    'PT': 'Portugal', 'BR': 'Brazil',
    'US': 'United States', 'GB': 'United Kingdom'
  };
  return names[code] || code;
}

let currentLang = localStorage.getItem('tfot_lang') || 'en';
let translations = {};
let companies = [];

// Country code to language mapping (partial, based on primary countries)
const COUNTRY_TO_LANG = {
  'RU': 'ru', 'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en',
  'CN': 'zh', 'TW': 'zh', 'HK': 'zh',
  'JP': 'ja',
  'FR': 'fr', 'BE': 'fr', // Quebec
  'DE': 'de', 'AT': 'de', 'CH': 'de',
  'IN': 'hi',
  'IT': 'it',
  'ES': 'es', 'MX': 'es', 'AR': 'es', 'CO': 'es',
  'KR': 'ko',
  'SA': 'ar', 'EG': 'ar', 'AE': 'ar',
  'IL': 'he',
  'TZ': 'sw', 'KE': 'sw', 'UG': 'sw',
  'BR': 'pt', 'PT': 'pt',
  'TR': 'tr',
  'NL': 'nl',
  'DK': 'da',
  'NO': 'no',
  'SE': 'sv',
  'FI': 'fi'
};

// Load translations for a language
async function loadLang(lang) {
  console.log(`Loading language: ${lang}`);
  try {
    const response = await fetch(`./assets/lang/${lang}.json`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch ${lang}.json`);
    }
    translations = await response.json();
    console.log(`Language ${lang} loaded successfully`);
    currentLang = lang;
    localStorage.setItem('tfot_lang', lang);
    updateContent();
    updateSocials();
    updateLangSelectDisplay();
    if (document.querySelector('.companies-list')) {
      loadCompanies();
    }
    if (window.location.pathname.includes('careers.html')) {
      loadCareers();
    }
    if (window.location.pathname.includes('contact.html')) {
      loadContacts();
      initRegionSelector();
    }
    setRTL();
    initLangSwitcher();
    if (['en', 'es', 'pt'].includes(lang)) initRegionSelector();
    animateSections();
  } catch (error) {
    console.error(`Error loading language ${lang}:`, error);
    // Fallback to English
    if (lang !== 'en') {
      loadLang('en');
    } else {
      console.error('Fallback to English also failed. Using empty translations.');
      translations = {};
      updateContent();
    }
  }
}

// Update all DOM elements with data-i18n attribute
function updateContent() {
  console.log('Starting content update for lang:', currentLang);
  const sections = document.querySelectorAll('.glass, .hero, #companies, .vacancies-section, .apply-section, .location-card');
  sections.forEach(section => {
    section.classList.remove('visible');
  });
  const elements = document.querySelectorAll('[data-i18n]');
  console.log(`Found ${elements.length} elements with data-i18n`);
  elements.forEach(el => {
    const key = el.dataset.i18n;
    const keys = key.split('.');
    let value = translations;
    for (let k of keys) {
      if (value == null || typeof value !== 'object') {
        value = '';
        break;
      }
      value = value[k];
    }
    // Handle object for region-specific
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const region = localStorage.getItem('tfot_region') || currentLang.toUpperCase();
      value = value[region] || value.default || Object.values(value)[0] || '';
    }
    if (typeof value === 'string') {
      el.textContent = value;
    } else if (Array.isArray(value)) {
      el.innerHTML = value.map(v => `<li>${v}</li>`).join('');
    } else {
      el.textContent = value || '';
    }
  });
  console.log('Content update completed');
  animateSections();
}

function animateSections() {
  const sections = document.querySelectorAll('.glass, .hero, #companies, .vacancies-section, .apply-section, .location-card');
  sections.forEach((section, index) => {
    setTimeout(() => {
      section.classList.add('visible');
    }, index * 200);
  });
}

// Load and display careers vacancies
function loadCareers() {
  if (translations.careers && translations.careers.vacancies) {
    const container = document.getElementById('jobs-container');
    if (container) {
      container.innerHTML = translations.careers.vacancies.map(job => `
        <div class="job-card">
          <h3>${job.title}</h3>
          <ul>
            ${job.responsibilities.map(resp => `<li>${resp}</li>`).join('')}
          </ul>
        </div>
      `).join('');
    }
  }
}

// Load and display companies
async function loadCompanies() {
  console.log('Loading companies data');
  try {
    const response = await fetch('./assets/data/companies.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch companies.json`);
    }
    companies = await response.json();
    console.log(`Loaded ${companies.length} companies`);
    if (translations.companies) {
      if (translations.companies.companies && Array.isArray(translations.companies.companies)) {
        // Structure like fi: { companies: [{title, desc, cat}, ...] }
        companies.forEach((company, index) => {
          const trans = translations.companies.companies[index];
          if (trans) {
            company.title = trans.title || company.name;
            company.desc = trans.desc || company.description;
            company.cat = trans.cat || company.category;
          }
        });
      } else if (translations.companies.names && Array.isArray(translations.companies.names) && translations.companies.descriptions && Array.isArray(translations.companies.descriptions)) {
        // Structure like en/ru: { names: [...], descriptions: [...] }
        companies.forEach((company, index) => {
          company.title = translations.companies.names[index] || company.name;
          company.desc = translations.companies.descriptions[index] || company.description;
          company.cat = company.category;
        });
      }
      // For other langs without specific companies data, use json fields directly
    }

    // Fallback for undefined translations
    companies.forEach(company => {
      company.title = company.title || company.name;
      company.desc = company.desc || company.description;
      company.cat = company.cat || company.category;
    });
    const container = document.querySelector('.companies-list');
    if (container) {
      console.log('Rendering companies to .companies-list');
      container.innerHTML = companies.map(company => `
        <div class="company-card">
          <img src="${company.image || `https://via.placeholder.com/200x150?text=${encodeURIComponent(company.name)}`}" alt="${company.name}" class="${`company-logo ${company.name === 'Eliza' ? 'eliza-logo' : ''}`}">
          <h3>${company.title}</h3>
          ${company.cat ? `<p class="category">${company.cat}</p>` : ''}
          <p>${company.desc}</p>
        </div>
      `).join('');
      
      // Staggered glassmorphism fade-in animation
      const cards = container.querySelectorAll('.company-card');
      cards.forEach((card, index) => {
        setTimeout(() => {
          card.classList.add('visible');
        }, index * 150); // 0.15s stagger for smooth sequence
      });
      
      console.log('Companies rendered successfully');
      animateSections();
    } else {
      console.warn('No .companies-list element found');
    }
  } catch (error) {
    console.error('Error loading companies:', error);
  }
}

// Update footer socials based on current lang
function updateSocials() {
  const socialContainers = document.querySelectorAll('.social-links');
  if (socialContainers.length > 0 && translations.footer && translations.footer.socials) {
    const region = localStorage.getItem('tfot_region') || currentLang;
    let socialKey = currentLang;
    if (['en', 'es', 'pt'].includes(currentLang) && region.startsWith(currentLang + '-')) {
      socialKey = region;
    }
    const networks = translations.footer.socials[socialKey] || translations.footer.socials[currentLang] || [];
    const html = networks.map(network => {
      const iconMap = {
        'VK': 'fab fa-vk', 'Telegram': 'fab fa-telegram', 'Instagram': 'fab fa-instagram',
        'Twitter': 'fab fa-x-twitter', 'X': 'fab fa-x-twitter', 'LinkedIn': 'fab fa-linkedin', 'Facebook': 'fab fa-facebook', 'Snapchat': 'fab fa-snapchat',
        'YouTube': 'fab fa-youtube',
        'WeChat': 'fab fa-weixin', 'Weibo': 'fab fa-weibo', 'Douyin': 'fab fa-tiktok',
        'Xing': 'fab fa-xing', 'WhatsApp': 'fab fa-whatsapp', 'Line': 'fab fa-line',
        'KakaoTalk': 'fas fa-comments', 'Naver': 'fas fa-globe',
        'OK': 'fab fa-odnoklassniki'
      };
      const iconClass = iconMap[network] || 'fas fa-share';
      return `<a href="#" aria-label="${network}"><i class="${iconClass}"></i></a>`;
    }).join('');
    socialContainers.forEach(container => {
      container.innerHTML = html;
    });
  }
}

// Set RTL direction
function setRTL() {
  const html = document.documentElement;
  if (RTL_LANGUAGES.includes(currentLang)) {
    html.setAttribute('dir', 'rtl');
    html.classList.add('rtl');
  } else {
    html.setAttribute('dir', 'ltr');
    html.classList.remove('rtl');
  }
}

// Detect language based on IP
async function detectLang() {
  console.log('Detecting user language via IP');
  try {
    const response = await fetch('https://ipapi.co/json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: IP detection failed`);
    }
    const data = await response.json();
    const lang = COUNTRY_TO_LANG[data.country_code] || 'en';
    console.log(`Detected country: ${data.country_code}, language: ${lang}`);
    loadLang(lang);
  } catch (error) {
    console.error('Error detecting location:', error);
    console.log('Falling back to English');
    loadLang('en');
  }
}

// Language switcher event
function initLangSwitcher() {
  const select = document.getElementById('lang-select');
  if (select) {
    select.innerHTML = '';
    LANGUAGES.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang;
      option.textContent = FLAGS[lang] || lang.toUpperCase();
      if (lang === currentLang) {
        option.selected = true;
      }
      select.appendChild(option);
    });
    // Update display for multi-flag languages
    updateLangSelectDisplay();
    select.addEventListener('change', (e) => {
      const newLang = e.target.value;
      if (newLang === currentLang) return;
      const defaultRegion = getDefaultRegion(newLang);
      showGlobe(newLang, defaultRegion);
    });
  }
}

// Global function for language switch animation
const REGION_ANGLES = {
  'MX': 0, 'ES': 180, 'AR': 180, 'CL': 210, 'PE': 240,
  'BR': 90, 'PT': 90,
  'US': 30, 'GB': 60,
  'RU': 120, 'CN': 270, 'JP': 300, 'FR': 150, 'DE': 135, 'IN': 240, 'IT': 165, 'KR': 330, 'SA': 210, 'IL': 195, 'TZ': 225, 'TR': 180, 'NL': 165, 'DK': 150, 'NO': 135, 'SE': 120, 'FI': 105
};

function getDefaultRegion(lang) {
  const defaults = {
    'en': 'en-us',
    'es': 'es-es',
    'pt': 'pt-pt'
  };
  return defaults[lang] || '';
}

function applyLocale(locale, region) {
  localStorage.setItem('tfot_lang', locale);
  localStorage.setItem('tfot_region', region || '');
  loadLang(locale).then(() => {
    updateLangSelectDisplay();
    // Update region selector active state
    document.querySelectorAll('.flag-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`[data-region="${region}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    // Render region-specific content
    if (window.location.pathname.includes('contact.html')) {
      loadContacts();
    } else {
      updateContent();
      if (document.querySelector('.companies-list')) loadCompanies();
      if (window.location.pathname.includes('careers.html')) loadCareers();
    }
    animateSections();
  });
}

function getRegionAngle(code) {
  let country;
  if (code.includes('-')) {
    country = code.split('-')[1].toUpperCase();
  } else {
    const langToCountry = {
      'en': 'US', 'ru': 'RU', 'zh': 'CN', 'ja': 'JP', 'fr': 'FR', 'de': 'DE', 'hi': 'IN',
      'it': 'IT', 'es': 'ES', 'ko': 'KR', 'ar': 'SA', 'he': 'IL', 'sw': 'TZ', 'pt': 'PT',
      'tr': 'TR', 'nl': 'NL', 'da': 'DK', 'no': 'NO', 'sv': 'SE', 'fi': 'FI'
    };
    country = langToCountry[code] || code.toUpperCase();
  }
  return REGION_ANGLES[country] || 0;
}

function showGlobe(newLang, region = null) {
  // Create modal overlay
  const modal = document.createElement('div');
  modal.id = 'globe-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex; justify-content: center; align-items: center;
    z-index: 9999;
    opacity: 0; transition: opacity 0.3s ease;
  `;
  
  // Create globe element
  const country = region ? region.split('-')[1].toLowerCase() : null;
  const globeClass = country ? `${newLang} ${country}` : newLang;
  const globe = document.createElement('div');
  globe.className = `globe spinning ${globeClass}`;
  globe.style.cssText = `
    width: 200px; height: 200px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #3498db, #2c3e50 40%, #34495e);
    position: relative;
    animation: spin 3s linear;
    box-shadow: 0 0 20px rgba(52, 152, 219, 0.5);
    transition: transform 1s ease;
  `;
  
  // Highlight after spin
  globe.addEventListener('animationend', () => {
    globe.classList.remove('spinning');
    globe.classList.add('highlighted');
    setTimeout(() => {
      applyLocale(newLang, region);
      const angle = getRegionAngle(region || newLang);
      globe.style.transform = `rotateY(${angle}deg)`;
      modal.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(modal);
      }, 300);
    }, 500);
  });
  
  modal.appendChild(globe);
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.style.opacity = '1');
}

// Global function for portfolio animation
function showPortfolioAnimation() {
  const modal = document.createElement('div');
  modal.id = 'portfolio-modal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.8); z-index: 9998;
    display: flex; justify-content: center; align-items: center;
    opacity: 0; transition: opacity 0.3s ease;
  `;
  
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 300 200');
  svg.setAttribute('width', '300');
  svg.setAttribute('height', '200');
  svg.style.cssText = 'filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3)); transform-style: preserve-3d; perspective: 1000px;';
  
  // Suitcase body
  const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  body.setAttribute('x', '50');
  body.setAttribute('y', '80');
  body.setAttribute('width', '200');
  body.setAttribute('height', '80');
  body.setAttribute('fill', '#4a4a4a');
  body.setAttribute('rx', '5');
  body.setAttribute('ry', '5');
  body.classList.add('suitcase-body');
  
  // Suitcase lid
  const lid = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  lid.setAttribute('x', '50');
  lid.setAttribute('y', '50');
  lid.setAttribute('width', '200');
  lid.setAttribute('height', '30');
  lid.setAttribute('fill', '#6a6a6a');
  lid.setAttribute('rx', '5');
  lid.setAttribute('ry', '5');
  lid.classList.add('suitcase-lid');
  
  // Handle
  const handle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  handle.setAttribute('x', '130');
  handle.setAttribute('y', '45');
  handle.setAttribute('width', '40');
  handle.setAttribute('height', '8');
  handle.setAttribute('fill', '#8a8a8a');
  handle.setAttribute('rx', '4');
  
  // Straps
  const strap1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  strap1.setAttribute('x', '70');
  strap1.setAttribute('y', '90');
  strap1.setAttribute('width', '160');
  strap1.setAttribute('height', '6');
  strap1.setAttribute('fill', '#333');
  
  const strap2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  strap2.setAttribute('x', '70');
  strap2.setAttribute('y', '130');
  strap2.setAttribute('width', '160');
  strap2.setAttribute('height', '6');
  strap2.setAttribute('fill', '#333');
  
  svg.appendChild(lid);
  lid.appendChild(handle);
  svg.appendChild(body);
  svg.appendChild(strap1);
  svg.appendChild(strap2);
  modal.appendChild(svg);
  document.body.appendChild(modal);
  
  requestAnimationFrame(() => modal.style.opacity = '1');
  
  // Trigger lid opening after show
  setTimeout(() => {
    lid.classList.add('open');
  }, 100);
  
  // Animate on end
  lid.addEventListener('animationend', () => {
    modal.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(modal);
      window.location.href = 'companies.html#companies';
    }, 300);
  });
}

// Basic form handling
function initForms() {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      console.log('Form submitted:', data);
      alert('Thank you for your submission! We will contact you soon.');
      form.reset();
    });
  });
}

function initNavTransitions() {
  document.querySelectorAll('.menu a').forEach(a => {
    a.addEventListener('click', (e) => {
      // Only for internal links
      if (!a.href.startsWith(window.location.origin) || a.getAttribute('href').startsWith('#')) return;
      e.preventDefault();
      const targetHref = a.getAttribute('href');
      const wrapper = document.querySelector('.section-wrapper');
      if (!wrapper) {
        window.location.href = targetHref;
        return;
      }
      wrapper.classList.add('section-exit');
      requestAnimationFrame(() => wrapper.classList.add('section-exit-active'));
      const onEnd = (evt) => {
        if (evt.propertyName !== 'opacity') return;
        wrapper.removeEventListener('transitionend', onEnd);
        window.location.href = targetHref;
      };
      wrapper.addEventListener('transitionend', onEnd);
    });
  });
}

// Load and display contact locations
async function loadContacts() {
  try {
    const response = await fetch('./assets/data/contacts.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch contacts.json`);
    }
    const contactsData = await response.json();
    let localeData = contactsData.find(l => l.locale === currentLang);
    if (!localeData) {
      console.warn(`No contacts data for locale: ${currentLang}`);
      return;
    }
    let locations = localeData.locations;
    const tfot_region = localStorage.getItem('tfot_region') || (currentLang === 'en' ? 'en-us' : currentLang === 'es' ? 'es-es' : currentLang === 'pt' ? 'pt-pt' : null);
    let country_code = null;
    if (tfot_region) {
      const parts = tfot_region.split('-');
      country_code = parts.length > 1 ? parts[1].toUpperCase() : tfot_region.toUpperCase();
    }
    if (country_code && ['en', 'es', 'pt'].includes(currentLang)) {
      locations = locations.filter(loc => loc.country_code === country_code);
    } // For other langs, show all
    const container = document.getElementById('contacts-container');
    if (container) {
      container.innerHTML = locations.map(location => {
        const flag = getFlagFromCode(location.country_code);
        const mapEmbed = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3020!2d${location.lng}!3d${location.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${location.lat}%2C${location.lng}!5e0!3m2!1s${currentLang}!2s${location.country_code.toLowerCase()}!4v1720000000000`;
        return `
          <div class="location-card glass">
            <h3>${location.name || location.city} ${flag}</h3>
            <p>${location.address || ''}</p>
            <p>Phone: ${location.phone || ''} | Email: ${location.email || ''}</p>
            <iframe src="${mapEmbed}" width="100%" height="300" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
          </div>
        `;
      }).join('');
      // Staggered animation for location cards
      const cards = container.querySelectorAll('.location-card');
      cards.forEach((card, index) => {
        setTimeout(() => {
          card.classList.add('visible');
        }, index * 200);
      });
    }
    animateSections();
  } catch (error) {
    console.error('Error loading contacts:', error);
  }
}

// Initialize app on load
document.addEventListener('DOMContentLoaded', () => {
  // Inject CSS for animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }
    @keyframes glow { from { opacity: 0.7; } to { opacity: 1; } }
    .globe.highlighted { animation: none; box-shadow: 0 0 30px rgba(0, 255, 136, 0.8); }
    .globe.ru::after { content: '🇷🇺'; position: absolute; top: 20%; right: 20%; font-size: 40px; text-shadow: 0 0 10px red; animation: glow 1s ease-in-out infinite alternate; }
    .globe.en::after { content: '🇺🇸'; position: absolute; top: 40%; left: 30%; font-size: 40px; text-shadow: 0 0 10px blue; animation: glow 1s ease-in-out infinite alternate; }
    .globe.zh::after { content: '🇨🇳'; position: absolute; top: 30%; right: 40%; font-size: 40px; text-shadow: 0 0 10px orange; animation: glow 1s ease-in-out infinite alternate; }
    .globe.ja::after { content: '🇯🇵'; position: absolute; top: 50%; left: 20%; font-size: 40px; text-shadow: 0 0 10px red; animation: glow 1s ease-in-out infinite alternate; }
    .globe.fr::after { content: '🇫🇷'; position: absolute; top: 25%; left: 35%; font-size: 40px; text-shadow: 0 0 10px blue; animation: glow 1s ease-in-out infinite alternate; }
    .globe.de::after { content: '🇩🇪'; position: absolute; top: 45%; right: 25%; font-size: 40px; text-shadow: 0 0 10px black; animation: glow 1s ease-in-out infinite alternate; }
    .globe.hi::after { content: '🇮🇳'; position: absolute; top: 60%; left: 40%; font-size: 40px; text-shadow: 0 0 10px orange; animation: glow 1s ease-in-out infinite alternate; }
    .globe.it::after { content: '🇮🇹'; position: absolute; top: 35%; right: 30%; font-size: 40px; text-shadow: 0 0 10px green; animation: glow 1s ease-in-out infinite alternate; }
    .globe.es::after { content: '🇪🇸'; position: absolute; top: 20%; left: 25%; font-size: 40px; text-shadow: 0 0 10px red; animation: glow 1s ease-in-out infinite alternate; }
    .globe.ko::after { content: '🇰🇷'; position: absolute; top: 55%; right: 35%; font-size: 40px; text-shadow: 0 0 10px red; animation: glow 1s ease-in-out infinite alternate; }
    .globe.ar::after { content: '🇸🇦'; position: absolute; top: 15%; left: 45%; font-size: 40px; text-shadow: 0 0 10px green; animation: glow 1s ease-in-out infinite alternate; }
    .globe.he::after { content: '🇮🇱'; position: absolute; top: 70%; right: 40%; font-size: 40px; text-shadow: 0 0 10px blue; animation: glow 1s ease-in-out infinite alternate; }
    .globe.sw::after { content: '🇹🇿'; position: absolute; top: 65%; left: 30%; font-size: 40px; text-shadow: 0 0 10px green; animation: glow 1s ease-in-out infinite alternate; }
    .globe.pt::after { content: '🇵🇹'; position: absolute; top: 40%; right: 15%; font-size: 40px; text-shadow: 0 0 10px green; animation: glow 1s ease-in-out infinite alternate; }
    .globe.tr::after { content: '🇹🇷'; position: absolute; top: 50%; left: 50%; font-size: 40px; text-shadow: 0 0 10px red; animation: glow 1s ease-in-out infinite alternate; }
    .globe.nl::after { content: '🇳🇱'; position: absolute; top: 30%; left: 15%; font-size: 40px; text-shadow: 0 0 10px orange; animation: glow 1s ease-in-out infinite alternate; }
    .globe.da::after { content: '🇩🇰'; position: absolute; top: 25%; right: 45%; font-size: 40px; text-shadow: 0 0 10px red; animation: glow 1s ease-in-out infinite alternate; }
    .globe.no::after { content: '🇳🇴'; position: absolute; top: 55%; left: 25%; font-size: 40px; text-shadow: 0 0 10px blue; animation: glow 1s ease-in-out infinite alternate; }
    .globe.sv::after { content: '🇸🇪'; position: absolute; top: 45%; right: 20%; font-size: 40px; text-shadow: 0 0 10px blue; animation: glow 1s ease-in-out infinite alternate; }
    .globe.fi::after { content: '🇫🇮'; position: absolute; top: 35%; left: 40%; font-size: 40px; text-shadow: 0 0 10px blue; animation: glow 1s ease-in-out infinite alternate; }
    .globe.en.us::after { content: '🇺🇸'; position: absolute; top: 40%; left: 30%; font-size: 40px; text-shadow: 0 0 10px blue; animation: glow 1s ease-in-out infinite alternate; }
    .globe.es.es::after { content: '🇪🇸'; position: absolute; top: 20%; left: 25%; font-size: 40px; text-shadow: 0 0 10px red; animation: glow 1s ease-in-out infinite alternate; }
    .globe.pt.pt::after { content: '🇵🇹'; position: absolute; top: 40%; right: 15%; font-size: 40px; text-shadow: 0 0 10px green; animation: glow 1s ease-in-out infinite alternate; }
    .globe.es.mx::after { content: '🇲🇽'; position: absolute; top: 20%; left: 20%; font-size: 40px; text-shadow: 0 0 10px green; animation: glow 1s ease-in-out infinite alternate; }
    .globe.es.ar::after { content: '🇦🇷'; position: absolute; top: 20%; right: 20%; font-size: 40px; text-shadow: 0 0 10px lightblue; animation: glow 1s ease-in-out infinite alternate; }
    .globe.es.cl::after { content: '🇨🇱'; position: absolute; top: 50%; left: 20%; font-size: 40px; text-shadow: 0 0 10px blue; animation: glow 1s ease-in-out infinite alternate; }
    .globe.es.pe::after { content: '🇵🇪'; position: absolute; top: 60%; right: 20%; font-size: 40px; text-shadow: 0 0 10px red; animation: glow 1s ease-in-out infinite alternate; }
    .globe.pt.br::after { content: '🇧🇷'; position: absolute; top: 40%; left: 40%; font-size: 40px; text-shadow: 0 0 10px green; animation: glow 1s ease-in-out infinite alternate; }
    .globe.en.gb::after { content: '🇬🇧'; position: absolute; top: 40%; right: 30%; font-size: 40px; text-shadow: 0 0 10px blue; animation: glow 1s ease-in-out infinite alternate; }
  `;
  document.head.appendChild(style);

  // Detect language or use stored
  const storedLang = localStorage.getItem('tfot_lang') || navigator.language.split('-')[0] || 'en';
  const storedRegion = localStorage.getItem('tfot_region') || '';
  if (storedLang && LANGUAGES.includes(storedLang)) {
    applyLocale(storedLang, storedRegion);
  } else {
    detectLang();
  }
  initLangSwitcher();
  initForms();
  initNavTransitions();
  // Enter animation
  const wrapper = document.querySelector('.section-wrapper');
  if (wrapper) {
    wrapper.classList.add('section-enter');
    requestAnimationFrame(() => wrapper.classList.add('section-enter-active'));
    setTimeout(() => {
      wrapper.classList.remove('section-enter', 'section-enter-active');
    }, 700);
  }
  if (window.location.pathname.includes('contact.html')) {
    initRegionSelector();
  }
  
  // Portfolio button listener
  const portfolioBtn = document.getElementById('portfolio-btn');
  if (portfolioBtn) {
    portfolioBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showPortfolioAnimation();
    });
  }
  
  // Smooth scroll to hash on load
  if (window.location.hash) {
    setTimeout(() => {
      const target = document.querySelector(window.location.hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
      animateSections();
    }, 500);
  } else {
    animateSections();
  }
});

function initRegionSelector() {
  let selector = document.querySelector('.region-selector');
  if (!selector) {
    selector = document.createElement('div');
    selector.className = 'region-selector';
    selector.setAttribute('role', 'tablist');
    selector.setAttribute('aria-label', 'Region selector');
    const langSelect = document.getElementById('lang-select');
    if (langSelect && langSelect.parentNode) {
      langSelect.parentNode.insertBefore(selector, langSelect.nextSibling);
    }
  }
  selector.innerHTML = '';

  const showSelector = ['en', 'es', 'pt'].includes(currentLang);
  selector.style.display = showSelector ? 'flex' : 'none';
  if (!showSelector) return;

  let regions = [];
  if (currentLang === 'en') {
    regions = [
      {locale: 'en', region: 'en-us', flag: '🇺🇸', label: 'English - United States'},
      {locale: 'en', region: 'en-gb', flag: '🇬🇧', label: 'English - United Kingdom'}
    ];
  } else if (currentLang === 'es') {
    regions = [
      {locale: 'es', region: 'es-es', flag: '🇪🇸', label: 'Español - España'},
      {locale: 'es', region: 'es-mx', flag: '🇲🇽', label: 'Español - México'},
      {locale: 'es', region: 'es-ar', flag: '🇦🇷', label: 'Español - Argentina'},
      {locale: 'es', region: 'es-cl', flag: '🇨🇱', label: 'Español - Chile'},
      {locale: 'es', region: 'es-pe', flag: '🇵🇪', label: 'Español - Perú'}
    ];
  } else if (currentLang === 'pt') {
    regions = [
      {locale: 'pt', region: 'pt-pt', flag: '🇵🇹', label: 'Português - Portugal'},
      {locale: 'pt', region: 'pt-br', flag: '🇧🇷', label: 'Português - Brasil'}
    ];
  }

  regions.forEach(r => {
    const btn = document.createElement('button');
    btn.className = 'flag-btn';
    btn.dataset.locale = r.locale;
    btn.dataset.region = r.region;
    btn.setAttribute('aria-label', r.label);
    btn.textContent = r.flag;
    if (localStorage.getItem('tfot_region') === r.region) {
      btn.classList.add('active');
    }
    btn.addEventListener('click', () => {
      showGlobe(r.locale, r.region);
      applyLocale(r.locale, r.region);
    });
    selector.appendChild(btn);
  });
}
function updateLangSelectDisplay() {
  const select = document.getElementById('lang-select');
  if (!select) return;

  const selectedOption = select.options[select.selectedIndex];
  const lang = currentLang;
  const region = localStorage.getItem('tfot_region') || getDefaultRegion(lang);

  let displayFlag = FLAGS[lang];
  if (['en', 'es', 'pt'].includes(lang) && region) {
    const flagMap = {
      // English
      'en-us': '🇺🇸',
      'en-gb': '🇬🇧',
      // Spanish
      'es-es': '🇪🇸',
      'es-mx': '🇲🇽',
      'es-ar': '🇦🇷',
      'es-cl': '🇨🇱',
      'es-pe': '🇵🇪',
      // Portuguese
      'pt-pt': '🇵🇹',
      'pt-br': '🇧🇷'
    };
    displayFlag = flagMap[region] || FLAGS[lang];
  }

  selectedOption.textContent = displayFlag || lang.toUpperCase();
}