import {
  sampleRUM,
  fetchPlaceholders,
  buildBlock,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForLCP,
  loadBlocks,
  loadCSS,
} from './aem.js';

const LCP_BLOCKS = ['bento', 'hero']; // add your LCP blocks to the list

/**
 * Returns the true origin of the current page in the browser.
 * If the page is running in a iframe with srcdoc, the ancestor origin is returned.
 * @returns {String} The true origin
 */
export function getOrigin() {
  const { location } = window;
  return location.href === 'about:srcdoc' ? window.parent.location.origin : location.origin;
}

/**
 * Returns the true of the current page in the browser.mac
 * If the page is running in a iframe with srcdoc,
 * the ancestor origin + the path query param is returned.
 * @returns {String} The href of the current page or the href of the block running in the library
 */
export function getHref() {
  if (window.location.href !== 'about:srcdoc') return window.location.href;

  const { location: parentLocation } = window.parent;
  const urlParams = new URLSearchParams(parentLocation.search);
  return `${parentLocation.origin}${urlParams.get('path')}`;
}

async function decoratePreviousNext(placeholders) {
  const contentType = window.location.pathname.split('/')[1];
  if (contentType) {
    const response = await fetch(`/query-index.json?sheet=${contentType}`);
    if (response.ok) {
      const { data } = await response.json();
      if (data) {
        const path = window.location.pathname;
        const index = data.findIndex((item) => item.path === path);
        const previous = data[index - 1];
        const next = data[index + 1];

        const { nextLinkText, previousLinkText } = placeholders;
        const previousLink = previous?.path || `/${contentType}`;
        const nextLink = next?.path || `/${contentType}`;
        const previousTitle = previous?.title || previousLinkText;
        const nextTitle = next?.title || nextLinkText;

        if (previousLink || previousLinkText || nextLink || nextLinkText) {
          const pagination = document.createElement('div');
          pagination.classList.add('pagination-wrapper');
          const previousLinkHTML = previousLink ? `<li>
                <a href="${previousLink}" title="${previous?.title || previousLinkText}" class="pagination-link previous">
                  <span class="pretitle">
                    <span class="icon icon-arrow-left">
                      <img class="light-mode" data-icon-name="arrow-left" src="/icons/arrow-left.svg" loading="lazy" alt="arrow-left" width="16" height="16">
                      <img class="dark-mode" data-icon-name="arrow-left" src="/icons/arrow-left-inverted.svg" loading="lazy" alt="arrow-left" width="16" height="16">
                    </span>
                    <span>${previousLinkText}</span>
                  </span>
                  <strong class="font-display text-md">${previousTitle}</strong>
                </a>
              </li>` : '';
          const nextLinkHTML = nextLink ? `<li>
                <a href="${nextLink}" title="${next?.title || nextLinkText}" class="pagination-link next">
                  <span class="pretitle">
                    <span>${nextLinkText}</span>
                    <span class="icon icon-arrow-right">
                      <img class="light-mode" data-icon-name="arrow-right" src="/icons/arrow-right.svg" loading="lazy" alt="arrow-right" width="16" height="16">
                      <img class="dark-mode" data-icon-name="arrow-right" src="/icons/arrow-right-inverted.svg" loading="lazy" alt="arrow-right" width="16" height="16">
                    </span>
                  </span>
                  <strong class="font-display text-md">${nextTitle}</strong>
                </a>
              </li>` : '';

          if (previousLink || nextLink) {
            pagination.innerHTML = `<ul>${previousLinkHTML}${nextLinkHTML}</ul>`;
            document.querySelector('main .section:last-child').appendChild(pagination);
          }
        }
      }
    }
  }
}

async function decorateDetails(placeholders) {
  const { nextLinkText, websiteTitle } = placeholders;

  const hours = document.querySelector('meta[name="hours"]')?.getAttribute('content') || '';
  const address = document.querySelector('meta[name="address"]')?.getAttribute('content') || '';
  const telephone = document.querySelector('meta[name="telephone"]')?.getAttribute('content') || '';
  const website = document.querySelector('meta[name="website"]')?.getAttribute('content') || '';
  const email = document.querySelector('meta[name="email"]')?.getAttribute('content') || '';
  const onTap = document.querySelector('meta[name="on-tap"]')?.getAttribute('content') || '';

  if (hours || address || telephone || website || websiteTitle || email || onTap) {
    const detailsMarkup = `${(address || telephone || email || website) && `<div class="contact-info">
      <strong class="font-display text-md details-group-title">Contact</strong>
      <ul class="icon-list">
        ${address && `<li><span class="icon icon-map"><img class="light-mode" data-icon-name="map" src="/icons/map.svg" loading="lazy" alt="map-pin" width="16" height="16"><img class="dark-mode" data-icon-name="map" src="/icons/map-inverted.svg" loading="lazy" alt="map-pin" width="16" height="16"></span><a href="https://google.com/maps/place/${address.replaceAll('|', '').replaceAll(' ', '+')}">${address.replaceAll('|,', '<br/>')}</a></li>`}
        ${telephone && `<li><span class="icon icon-phone"><img  class="light-mode" data-icon-name="phone" src="/icons/phone.svg" loading="lazy" alt="phone" width="16" height="16"><img class="dark-mode" data-icon-name="phone" src="/icons/phone-inverted.svg" loading="lazy" alt="phone" width="16" height="16"></span><a href="tel:${telephone}" title="Telephone Number">${telephone}</a></li>`}
        ${email && `<li><span class="icon icon-mail"><img class="light-mode" data-icon-name="mail" src="/icons/mail.svg" loading="lazy" alt="mail" width="16" height="16"><img class="dark-mode" data-icon-name="mail" src="/icons/mail-inverted.svg" loading="lazy" alt="mail" width="16" height="16"></span><a href="mailto:${email}" title="${email}">${email}</a></li>`}
        ${website && `<li><span class="icon icon-link"><img class="light-mode" data-icon-name="link" src="/icons/link.svg" loading="lazy" alt="link" width="16" height="16"><img class="dark-mode" data-icon-name="link" src="/icons/link-inverted.svg" loading="lazy" alt="link" width="16" height="16"></span><a href="${website}" title="${websiteTitle || ''}">${websiteTitle || website}</a></li>`}
      </ul>
    </div>`}
    ${hours && `<div class="hours-info">
      <strong class="font-display text-md details-group-title">Hours</strong>
      <ul class="icon-list">
      <li><span class="icon icon-clock"><img class="light-mode" data-icon-name="clock" src="/icons/clock.svg" loading="lazy" alt="clock" width="16" height="16"><img class="dark-mode" data-icon-name="clock" src="/icons/clock-inverted.svg" loading="lazy" alt="clock" width="16" height="16"></span>${hours.replaceAll('|,', '<br/>')}</li>
      </ul>
    </div>`}
    ${onTap && `<div class="on-tap-info">
      <strong class="font-display text-sm details-group-title">${nextLinkText}</strong>
      <ul>${onTap.split(',').map((beer) => `<li>${beer}</li>`).join('')}</ul>
    </div>`}`;

    if (detailsMarkup?.trim()?.length > 0) {
      const contact = document.createElement('div');
      contact.classList.add('metadata-wrapper', 'details-group');
      contact.innerHTML = detailsMarkup;
      document.querySelector('.details-wrapper').appendChild(contact);
    }
  }
}

async function decorateTemplateDetails() {
  const placeholders = await fetchPlaceholders();
  const detailsWrapper = document.createElement('div');
  detailsWrapper.classList.add('details-wrapper');
  document.querySelector('main .section').appendChild(detailsWrapper);
  decoratePreviousNext(placeholders);
  decorateDetails(placeholders);
}

// add more delayed functionality here
const templateConfig = {
  blog: decorateTemplateDetails,
  details: decorateTemplateDetails,
  drinks: decorateTemplateDetails,
  eat: decorateTemplateDetails,
  events: decorateTemplateDetails,
  play: decorateTemplateDetails,
  stay: decorateTemplateDetails,
};

function decorateTemplate() {
  const template = document.querySelector('meta[name="template"]')?.getAttribute('content')?.split(' ');
  if (template) {
    template.forEach((t) => templateConfig[t] && templateConfig[t]());
  }
}

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    // main.querySelector('img')?.setAttribute('loading', 'eager');
    decorateMain(main);
    document.body.classList.add('appear');
    await waitForLCP(LCP_BLOCKS);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadBlocks(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(document.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
  decorateTemplate();

  sampleRUM('lazy');
  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  sampleRUM.observe(main.querySelectorAll('picture > img'));
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 1000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  if (window.localStorage.getItem('darkMode') === 'true') {
    document.documentElement.classList.add('dark-mode');
  } else if (window.localStorage.getItem('darkMode') === 'false') {
    document.documentElement.classList.remove('dark-mode');
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark-mode');
  }
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

function showCookieBanner() {
  const cookieBanner = document.body.querySelector('#cookie-notification:not(.appear)');
  if (cookieBanner) {
    cookieBanner.classList.add('appear');
  }
}

document.body.addEventListener('scroll', showCookieBanner, { once: true, passive: true });
document.body.addEventListener('mousemove', showCookieBanner, { once: true, passive: true });
document.body.addEventListener('touchmove', showCookieBanner, { once: true, passive: true });
document.body.addEventListener('keydown', showCookieBanner, { once: true, passive: true });

loadPage();

// Side-effects
(async function daPreview() {
  const { searchParams } = new URL(window.location.href);
  const daPreview = searchParams.get('dapreview');
  if (daPreview) {
    const origin = daPreview === 'local' ? 'http://localhost:3000' : 'https://da.live';
    const { default: livePreview } = await import(`${origin}/scripts/dapreview.js`);
    livePreview(loadPage);
  }
}());

const previewed = ({ detail }) => {
  const sk = detail.data;
  // your custom code from button.action goes here
  /* eslint-disable no-console */
  console.log('previewed', sk, detail);
};

const sk = document.querySelector('helix-sidekick');
if (sk) {
  // sidekick already loaded
  sk.addEventListener('custom:previewed', previewed);
  sk.addEventListener('previewed', previewed);
} else {
  // wait for sidekick to be loaded
  document.addEventListener('sidekick-ready', () => {
    document.querySelector('helix-sidekick')
      .addEventListener('custom:previewed', previewed);
    document.querySelector('helix-sidekick')
      .addEventListener('previewed', previewed);
  }, { once: true });
}
