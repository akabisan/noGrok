const statusToggle = document.getElementById('statusToggle');
const radios = document.getElementsByName('filterMode');

browser.storage.local.get(['enabled', 'mode']).then((res) => {
  statusToggle.checked = res.enabled !== false;
  
  const currentMode = res.mode || 'strict';
  for (const radio of radios) {
    if (radio.value === currentMode) {
      radio.checked = true;
    }
  }
});

statusToggle.addEventListener('change', () => {
  browser.storage.local.set({ enabled: statusToggle.checked });
  browser.tabs.reload();
});

radios.forEach(radio => {
  radio.addEventListener('change', (e) => {
    if (e.target.checked) {
      browser.storage.local.set({ mode: e.target.value });
      browser.tabs.reload();
    }
  });
});