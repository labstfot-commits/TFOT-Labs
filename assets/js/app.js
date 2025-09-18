
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

let currentLang = localStorage.getItem('lang') || 'en';
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
    localStorage.setItem('lang', lang);
    updateContent();
    updateSocials();
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
    if (typeof value === 'string') {
      el.textContent = value;
    } else if (Array.isArray(value)) {
      el.innerHTML = value.map(v => `<li>${v}</li>`).join('');
    } else {
      value = ''; // Fallback for non-string/non-array
    }
  });
  console.log('Content update completed');
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
          <img src="https://via.placeholder.com/200x150?text=${encodeURIComponent(company.name)}" alt="${company.name}" class="company-logo">
          <h3>${company.title}</h3>
          ${company.cat ? `<p class="category">${company.cat}</p>` : ''}
          <p>${company.desc}</p>
        </div>
      `).join('');
      console.log('Companies rendered successfully');
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
  if (socialContainers.length > 0 && translations.footer && translations.footer.socials && translations.footer.socials[currentLang]) {
    const networks = translations.footer.socials[currentLang];
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
      option.textContent = FLAGS[lang];
      if (lang === currentLang) {
        option.selected = true;
      }
      select.appendChild(option);
    });
    select.addEventListener('change', (e) => {
      loadLang(e.target.value);
      if (document.querySelector('.companies-list')) {
        loadCompanies();
      }
      if (window.location.pathname.includes('careers.html')) {
        loadCareers();
      }
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
    const region = localStorage.getItem('region') || (currentLang === 'en' ? 'US' : currentLang === 'es' ? 'ES' : currentLang === 'pt' ? 'PT' : null);
    if (['en', 'es', 'pt'].includes(currentLang) && region) {
      locations = locations.filter(loc => loc.country_code === region);
    } // For other langs, show all
    const container = document.getElementById('contacts-container');
    if (container) {
      container.innerHTML = locations.map(location => {
        const flag = getFlagFromCode(location.country_code);
        const mapEmbed = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3020!2d${location.lng}!3d${location.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z${location.lat}%2C${location.lng}!5e0!3m2!1s${currentLang}!2sus!4v1720000000000`;
        return `
          <div class="location-card">
            <h3>${location.name || location.city} ${flag}</h3>
            <p>${location.address || ''}</p>
            <p>Phone: ${location.phone || ''} | Email: ${location.email || ''}</p>
            <iframe src="${mapEmbed}" width="100%" height="300" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
          </div>
        `;
      }).join('');
    }
  } catch (error) {
    console.error('Error loading contacts:', error);
  }
}

// Initialize app on load
document.addEventListener('DOMContentLoaded', () => {
  // Detect language or use stored
  const storedLang = localStorage.getItem('lang');
  if (storedLang && LANGUAGES.includes(storedLang)) {
    loadLang(storedLang);
  } else {
    detectLang();
  }
  initLangSwitcher();
  initForms();
  if (window.location.pathname.includes('contact.html')) {
    initRegionSelector();
  }
});

// Region selector for es/pt
function initRegionSelector() {
  const select = document.getElementById('region-select');
  if (!select) return;

  const showSelector = ['en', 'es', 'pt'].includes(currentLang);
  select.style.display = showSelector ? 'block' : 'none';
  if (!showSelector) return;

  let options = [];
  if (currentLang === 'en') {
    options = ['US', 'GB'];
  } else if (currentLang === 'es') {
    options = ['ES', 'MX', 'AR', 'CL', 'PE'];
  } else if (currentLang === 'pt') {
    options = ['PT', 'BR'];
  }

  select.innerHTML = options.map(code => {
    const name = getRegionName(code, currentLang);
    return `<option value="${code}">${name} ${REGION_FLAGS[code] || ''}</option>`;
  }).join('');

  let defaultRegion = currentLang === 'en' ? 'US' : currentLang === 'es' ? 'ES' : 'PT';
  const savedRegion = localStorage.getItem('region') || defaultRegion;
  select.value = savedRegion;
  localStorage.setItem('region', savedRegion);

  select.addEventListener('change', (e) => {
    localStorage.setItem('region', e.target.value);
    loadContacts();
  });
}