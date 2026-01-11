const GROK_SELECTORS = [
    // 1. TWEET & TIMELINE ELEMENTS
    'article[data-testid="tweet"]',
    '[data-testid="UserCell"]',
    '[data-testid="trend"]',
    '[data-testid="cellInnerDiv"]',
    
    // 2. LINKS
    'a[role="link"][href*="/status/"]',
    'a[href*="/i/communities/"]',
    'a[href*="/i/lists/"]',
    
    '[aria-label*="Grok"]', 'button[aria-label*="Grok"]', '[data-testid*="Grok"]',
    '[aria-label*="grok"]', 'button[aria-label*="grok"]', '[data-testid*="grok"]',
    
    '[href*="/grok"]',
    '[data-testid="grok-drawer"]',
    '[data-testid="GrokDrawer"]'
].join(',');

let isEnabled = true;
let filterMode = 'strict';

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

        const testId = target.getAttribute('data-testid');

        let shouldRemove = false;

        const isGrokUI = (ariaLabel && ariaLabel.toLowerCase().includes('grok')) || 
                         (testId && testId.toLowerCase().includes('grok'));

        if (isGrokUI) {
            shouldRemove = true;
        }

        if (!shouldRemove) {
            if (filterMode === 'strict') {
                if (combinedText.includes('grok')) shouldRemove = true;
            } 
            else if (filterMode === 'lite') {
                if (
                    combinedText.includes('@grok') || 
                    combinedText.includes('#grok') || 
                    combinedText.includes('grok project') || 
                    combinedText.includes('/grok')
                ) {
                    shouldRemove = true;
                }
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
