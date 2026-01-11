// content.js

const GROK_SELECTORS = [
    'article[data-testid="tweet"]',
    '[data-testid="UserCell"]',
    '[data-testid="trend"]',
    '[data-testid="cellInnerDiv"]',
    'a[role="link"][href*="/status/"]',
    'a[aria-label="Grok"]',
    '[data-testid="grok-drawer"]'
].join(',');

let isEnabled = true;
let filterMode = 'strict'; // Default mode

if (typeof browser !== 'undefined' && browser.storage) {
    browser.storage.local.get(['enabled', 'mode']).then((res) => {
        if (res.enabled === false) isEnabled = false;
        if (res.mode) filterMode = res.mode;
    });
}

function processElement(el) {
    if (!el || el.nodeType !== 1 || el.hasAttribute('data-ungrok-checked')) return;

    const targets = [];
    if (el.matches && el.matches(GROK_SELECTORS)) targets.push(el);
    el.querySelectorAll(GROK_SELECTORS).forEach(child => targets.push(child));

    targets.forEach(target => {
        if (target.hasAttribute('data-ungrok-checked')) return;

        let combinedText = target.textContent.toLowerCase();
        
        const ariaLabel = target.getAttribute('aria-label');
        if (ariaLabel) combinedText += ' ' + ariaLabel.toLowerCase();
        const images = target.querySelectorAll('img');
        images.forEach(img => { if (img.alt) combinedText += ' ' + img.alt.toLowerCase(); });

        let shouldRemove = false;

        // --- FILTER LOGIC ---
        
        if (filterMode === 'strict') {
            // STRICT
            if (combinedText.includes('grok')) {
                shouldRemove = true;
            }
        } 
        else if (filterMode === 'lite') {
            // LITE
            if (
                combinedText.includes('@grok') || // Mention handle
                combinedText.includes('#grok') || // Hashtag
                combinedText.includes('grok project') || // Spam crypto biasanya
                combinedText.includes('/grok') // URL path
            ) {
                shouldRemove = true;
            }
        }

        if (shouldRemove) {
            target.style.setProperty('display', 'none', 'important');
        }

        target.setAttribute('data-ungrok-checked', 'true');
    });
}

const observer = new MutationObserver((mutations) => {
    if (!isEnabled) return;
    mutations.forEach((mutation) => mutation.addedNodes.forEach(processElement));
});

function init() {
    document.querySelectorAll(GROK_SELECTORS).forEach(processElement);
    observer.observe(document.body, { childList: true, subtree: true });
}

init();

if (typeof browser !== 'undefined' && browser.runtime) {
    browser.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
            if (changes.enabled) isEnabled = changes.enabled.newValue;
            if (changes.mode) filterMode = changes.mode.newValue;

            browser.tabs.reload(); 
        }
    });
}