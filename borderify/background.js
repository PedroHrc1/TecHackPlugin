// Objeto para armazenar domínios de terceiros por guia
let thirdPartyDomains = {};

// Função para extrair o domínio de uma URL
function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    console.error('URL inválida:', url);
    return '';
  }
}

// Listener para capturar todas as requisições
browser.webRequest.onBeforeRequest.addListener(
  function(details) {
    // Ignorar requisições sem tabId (por exemplo, do próprio navegador)
    if (details.tabId < 0) return;

    browser.tabs.get(details.tabId).then(tab => {
      if (tab && tab.url.startsWith('http')) {
        let mainDomain = getDomain(tab.url);
        let requestDomain = getDomain(details.url);

        if (mainDomain && requestDomain && mainDomain !== requestDomain) {
          if (!thirdPartyDomains[details.tabId]) {
            thirdPartyDomains[details.tabId] = new Set();
          }
          thirdPartyDomains[details.tabId].add(requestDomain);
        }
      }
    });
  },
  { urls: ["<all_urls>"] },
  []
);

// Limpar dados quando a guia é atualizada ou fechada
browser.tabs.onRemoved.addListener(function(tabId) {
  delete thirdPartyDomains[tabId];
});

browser.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'loading') {
    delete thirdPartyDomains[tabId];
  }
});

// Ouvir por mensagens do popup.js
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getThirdPartyDomains') {
    let tabId = message.tabId;
    let domains = thirdPartyDomains[tabId] ? Array.from(thirdPartyDomains[tabId]) : [];
    sendResponse({ domains: domains });
  }
});
