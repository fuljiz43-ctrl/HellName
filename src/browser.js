/**
 * NullBrowser - Browser Logic
 * Menggunakan Capacitor InAppBrowser (native WebView) - bukan iframe
 */

const Browser = (() => {
  const state = {
    history: [], historyIndex: -1, currentUrl: '', pages: 0,
  };

  const urlBar = document.getElementById('url-bar');
  const progressBar = document.getElementById('progress-bar');
  const homeScreen = document.getElementById('home-screen');
  const loadingOverlay = document.getElementById('loading-overlay');
  const loadingText = document.getElementById('loading-text');
  const webviewDiv = document.getElementById('webview');

  const LOADING_MESSAGES = [
    'Blocking ads & trackers...','Shielding your privacy...',
    'Nuking ad scripts...','Killing trackers...','Ad-free loading...',
  ];

  const isCapacitor = typeof window.Capacitor !== 'undefined';

  function init() {
    try {
      const s = JSON.parse(localStorage.getItem('nb_browser_state') || '{}');
      Object.assign(state, s);
    } catch {}
    document.getElementById('stat-pages').textContent = state.pages;
  }

  function navigate() {
    const raw = urlBar.value.trim();
    if (!raw) return;
    loadUrl(resolveUrl(raw));
  }

  function resolveUrl(input) {
    if (/^https?:\/\//i.test(input)) return input;
    if (/^[a-z0-9-]+\.[a-z]{2,}/i.test(input) && !input.includes(' ')) return 'https://' + input;
    return 'https://duckduckgo.com/?q=' + encodeURIComponent(input);
  }

  function loadUrl(url) {
    if (!url) return;
    if (AdBlock.shouldBlock(url)) { AdBlock.recordBlock(url); showToast('🛡️ Blocked by AdBlock'); return; }

    state.currentUrl = url;
    urlBar.value = url;
    if (state.historyIndex < state.history.length - 1) state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push(url);
    state.historyIndex = state.history.length - 1;

    state.pages++;
    document.getElementById('stat-pages').textContent = state.pages;
    try { localStorage.setItem('nb_browser_state', JSON.stringify({ pages: state.pages })); } catch {}
    AdBlock.updateUI();

    homeScreen.style.display = 'none';
    webviewDiv.style.cssText = 'display:block; background:#0a0a0f; position:absolute; inset:0;';

    showLoading();
    startProgress();

    // Buat iframe WebView internal (tetap di app, ga keluar)
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.cssText = 'width:100%; height:100%; border:none; background:#0a0a0f;';
    iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-downloads');
    iframe.setAttribute('allow', 'geolocation; microphone; camera; midi; encrypted-media; autoplay');
    
    iframe.onload = () => {
      hideLoading();
      setProgress(100);
      
      // Inject AdBlock ke dalam iframe jika same-origin
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc) {
          AdBlock.injectIntoIframe(iframeDoc);
        }
      } catch(e) {
        // Cross-origin, ga bisa inject (normal)
      }
    };
    
    iframe.onerror = () => {
      // Jika iframe gagal, tampilkan tombol open external
      showOpenButton(url);
    };
    
    webviewDiv.innerHTML = '';
    webviewDiv.appendChild(iframe);
    
    // Fallback timeout
    setTimeout(() => {
      if (!iframe.onload) {
        hideLoading();
        setProgress(100);
      }
    }, 5000);
  }

  function showOpenButton(url) {
    hideLoading(); setProgress(100);
    webviewDiv.innerHTML = `
      <div style="text-align:center;font-family:'JetBrains Mono',monospace;padding:24px;">
        <div style="font-size:48px;margin-bottom:12px;">🛡️</div>
        <div style="color:#00ff88;font-size:15px;font-weight:700;margin-bottom:6px;">AdBlock Active</div>
        <div style="color:#666680;font-size:10px;margin-bottom:20px;word-break:break-all;max-width:280px;">${url}</div>
        <button onclick="window.open('${url.replace(/'/g,"\\'")}','_system')"
          style="background:#00ff88;color:#000;border:none;padding:14px 28px;border-radius:10px;font-weight:800;font-size:15px;cursor:pointer;">
          🌐 Open Page
        </button>
      </div>`;
  }

  function goBack() {
    if (state.historyIndex > 0) { state.historyIndex--; loadUrl(state.history[state.historyIndex]); }
    else showHome();
  }
  function goForward() {
    if (state.historyIndex < state.history.length - 1) { state.historyIndex++; loadUrl(state.history[state.historyIndex]); }
  }
  function refreshPage() { if (state.currentUrl) loadUrl(state.currentUrl); }

  let progressInterval = null, progressValue = 0;
  function startProgress() {
    progressValue = 0; clearInterval(progressInterval);
    progressInterval = setInterval(() => {
      progressValue += Math.random() * 20;
      if (progressValue > 85) { progressValue = 85; clearInterval(progressInterval); }
      setProgress(progressValue);
    }, 150);
  }
  function setProgress(val) {
    progressBar.style.width = Math.min(val, 100) + '%';
    if (val >= 100) clearInterval(progressInterval);
  }
  function showLoading() {
    loadingText.textContent = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
    loadingOverlay.classList.add('show');
    setTimeout(hideLoading, 2500);
  }
  function hideLoading() { loadingOverlay.classList.remove('show'); }

  function showHome() {
    homeScreen.style.display = 'flex';
    webviewDiv.style.display = 'none';
    webviewDiv.innerHTML = '';
    urlBar.value = '';
    state.currentUrl = '';
    AdBlock.updateUI();
  }

  function showToast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#111118;border:1px solid #2a2a3a;color:#e8e8f0;padding:10px 20px;border-radius:20px;font-size:13px;font-family:JetBrains Mono,monospace;z-index:9999;white-space:nowrap;';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2000);
  }

  return { init, navigate, loadUrl, goBack, goForward, refreshPage, showHome, showToast };
})();

function navigate() { Browser.navigate(); }
function goBack() { Browser.goBack(); }
function goForward() { Browser.goForward(); }
function refreshPage() { Browser.refreshPage(); }
function loadUrl(url) { Browser.loadUrl(url); }
function showHome() { Browser.showHome(); }
function openAdblockPanel() { document.getElementById('ab-panel').classList.add('open'); document.getElementById('overlay').classList.add('show'); }
function closeAdblockPanel() { document.getElementById('ab-panel').classList.remove('open'); document.getElementById('overlay').classList.remove('show'); }
function toggleFilter(name) { AdBlock.toggleFilter(name); }
function showTabs() { Browser.showToast('🗂 Tabs — Coming Soon'); }
function showSettings() { Browser.showToast('⚙️ Settings — Coming Soon'); }

document.addEventListener('DOMContentLoaded', () => Browser.init());
