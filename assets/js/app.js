// TFOT Labs Multilingual App
// Handles language detection, loading translations, updating content, and dynamic elements

const LANGUAGES = ['ru', 'en', 'zh', 'ja', 'fr', 'de', 'hi', 'it', 'es', 'ko', 'ar', 'he', 'sw', 'pt', 'tr'];
const RTL_LANGUAGES = ['ar', 'he'];

let currentLang = localStorage.getItem('lang') || 'en';
let translations = {};
let companies = [];

// Country code to language mapping (partial, based on primary countries)
const COUNTRY_TO_LANG = {
  'RU': 'ru', 'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en',
  'CN': 'zh', 'TW': 'zh', 'HK': 'zh',
  'JP': 'ja',
  'FR': 'fr', 'BE': 'fr', 'CA': 'fr', // Quebec
  'DE': 'de', 'AT': 'de', 'CH': 'de',
  'IN': 'hi',
  'IT': 'it',
  'ES': 'es', 'MX': 'es', 'AR': 'es', 'CO': 'es',
  'KR': 'ko',
  'SA': 'ar', 'EG': 'ar', 'AE': 'ar',
  'IL': 'he',
  'TZ': 'sw', 'KE': 'sw', 'UG': 'sw',
  'BR': 'pt', 'PT': 'pt',
  'TR': 'tr'
};

// Load translations for a language
async function loadLang(lang) {
  try {
    const response = await fetch(`assets/lang/${lang}.json`);
    translations = await response.json();
    currentLang = lang;
    localStorage.setItem('lang', lang);
    updateContent();
    updateSocials();
    if (document.querySelector('.companies-list')) {
      loadCompanies();
    }
    setRTL();
  } catch (error) {
    console.error('Error loading language:', error);
    loadLang('en'); // Fallback
  }
}

// Update all DOM elements with data-i18n attribute
function updateContent() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const keys = key.split('.');
    let value = translations;
    keys.forEach(k => value = value[k]);
    if (typeof value === 'string') {
      el.textContent = value;
    } else if (Array.isArray(value)) {
      el.innerHTML = value.map(v => `<li>${v}</li>`).join('');
    }
  });
}

// Load and display companies
async function loadCompanies() {
  try {
    const response = await fetch('assets/data/companies.json');
    companies = await response.json();
    const container = document.querySelector('.companies-list');
    if (container) {
      container.innerHTML = companies.map(company => `
        <div class="company-card">
          <img src="${company.image}" alt="${company.name}" placeholder="Placeholder Image">
          <h3 data-i18n="companies.title">${company.name}</h3>
          <p>${company.description}</p>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading companies:', error);
  }
}

// Update footer socials based on current lang
function updateSocials() {
  const socialContainer = document.querySelector('.social-links');
  if (socialContainer && translations.footer && translations.footer.socials && translations.footer.socials[currentLang]) {
    const networks = translations.footer.socials[currentLang];
    socialContainer.innerHTML = networks.map(network => {
      const iconMap = {
        'VK': 'fab fa-vk', 'Telegram': 'fab fa-telegram', 'Instagram': 'fab fa-instagram',
        'Twitter': 'fab fa-twitter', 'LinkedIn': 'fab fa-linkedin', 'Facebook': 'fab fa-facebook-f',
        'WeChat': 'fab fa-weixin', 'Weibo': 'fab fa-weibo', 'Douyin': 'fab fa-tiktok',
        'Xing': 'fab fa-xing', 'WhatsApp': 'fab fa-whatsapp', 'Line': 'fab fa-line',
        'KakaoTalk': 'fab fa-comment', 'Naver': 'fab fa-search'
      };
      const iconClass = iconMap[network] || 'fas fa-share';
      return `<a href="#" aria-label="${network}"><i class="${iconClass}"></i></a>`;
    }).join('');
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
  try {
    const response = await fetch('https://ipapi.co/json');
    const data = await response.json();
    const lang = COUNTRY_TO_LANG[data.country_code] || 'en';
    loadLang(lang);
  } catch (error) {
    console.error('Error detecting location:', error);
    loadLang('en');
  }
}

// Language switcher event
function initLangSwitcher() {
  const select = document.getElementById('lang-select');
  if (select) {
    select.value = currentLang;
    select.addEventListener('change', (e) => {
      loadLang(e.target.value);
    });
  }
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

// Contact map placeholder
function initMap() {
  const mapContainer = document.getElementById('map');
  if (mapContainer) {
    mapContainer.innerHTML = `
      <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.142!2d-73.987!3d40.7589!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQ1JzMyLjQiTiA3M8KwNTknMTYuMiJX!5e0!3m2!1sen!2sus!4v1630000000000" width="100%" height="300" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
    `;
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initLangSwitcher();
  initForms();
  initMap();
  detectLang(); // Detect on load, or use currentLang if stored
  if (window.location.pathname.includes('companies.html')) {
    loadCompanies();
  }
});

// Expose functions for global use if needed
window.switchLang = loadLang;
window.loadCompanies = loadCompanies;