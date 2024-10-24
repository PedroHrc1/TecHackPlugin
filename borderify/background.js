// Objetos para armazenar dados por guia
let thirdPartyDomains = {};
let potentialHijacks = {};
let localStorageUsage = {};
let canvasFingerprintingEvents = {};
let cookieData = {};

// Função para extrair o domínio de uma URL
function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    console.error('URL inválida:', url);
    return '';
  }
}

// Listener para detectar domínios de terceiros
browser.webRequest.onBeforeRequest.addListener(
  function(details) {
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

// Listener para capturar cabeçalhos Set-Cookie
browser.webRequest.onHeadersReceived.addListener(
  function(details) {
    let tabId = details.tabId;
    if (tabId < 0) return;

    let responseHeaders = details.responseHeaders;
    if (!responseHeaders) return;

    let setCookieHeaders = responseHeaders.filter(header => header.name.toLowerCase() === 'set-cookie');
    if (setCookieHeaders.length > 0) {
      if (!cookieData[tabId]) {
        cookieData[tabId] = [];
      }

      browser.tabs.get(tabId).then(tab => {
        if (tab && tab.url.startsWith('http')) {
          let pageDomain = getDomain(tab.url);

          setCookieHeaders.forEach(header => {
            let cookieString = header.value;
            let cookie = parseSetCookieHeader(cookieString);

            // Determina se o cookie é de primeira ou terceira parte
            let requestDomain = getDomain(details.url);
            cookie.isFirstParty = requestDomain.endsWith(pageDomain);

            // Armazena os dados do cookie
            cookieData[tabId].push(cookie);
          });
        }
      });
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

// Função para analisar o cabeçalho Set-Cookie
function parseSetCookieHeader(cookieString) {
  let parts = cookieString.split(';').map(part => part.trim());
  let [nameValue, ...attributes] = parts;
  let [name, value] = nameValue.split('=');

  let cookie = {
    name: name,
    value: value,
    attributes: {},
    isSession: true,
    isFirstParty: true
  };

  attributes.forEach(attr => {
    let [attrName, attrValue] = attr.split('=');
    attrName = attrName.toLowerCase();

    if (attrName === 'expires' || attrName === 'max-age') {
      cookie.isSession = false;
    }

    cookie.attributes[attrName] = attrValue ? attrValue : true;
  });

  return cookie;
}

// Listener para mensagens
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getThirdPartyDomains') {
    let tabId = message.tabId;
    let domains = thirdPartyDomains[tabId] ? Array.from(thirdPartyDomains[tabId]) : [];
    sendResponse({ domains: domains });
  } else if (message.action === 'getPotentialHijacks') {
    let tabId = message.tabId;
    let hijacks = potentialHijacks[tabId] || [];
    sendResponse({ hijacks: hijacks });
  } else if (message.action === 'potentialHijackDetected') {
    let tabId = sender.tab.id;
    if (!potentialHijacks[tabId]) {
      potentialHijacks[tabId] = [];
    }
    potentialHijacks[tabId].push({
      url: message.details.url,
      scriptContent: message.details.scriptContent
    });
    console.warn('Potencial ameaça de hijacking detectada na guia', tabId);
  } else if (message.action === 'localStorageDetected') {
    let tabId = sender.tab.id;
    localStorageUsage[tabId] = {
      url: message.details.url,
      storageKeys: message.details.storageKeys
    };
    console.log('Uso de local storage detectado na guia', tabId);
  } else if (message.action === 'getLocalStorageUsage') {
    let tabId = message.tabId;
    let usage = localStorageUsage[tabId] || null;
    sendResponse({ usage: usage });
  } else if (message.action === 'canvasFingerprintDetected') {
    let tabId = sender.tab.id;
    if (!canvasFingerprintingEvents[tabId]) {
      canvasFingerprintingEvents[tabId] = [];
    }
    canvasFingerprintingEvents[tabId].push({
      url: message.details.url,
      method: message.details.method
    });
    console.warn('Canvas Fingerprinting detectado na guia', tabId, 'usando o método', message.details.method);
  } else if (message.action === 'getCanvasFingerprintingEvents') {
    let tabId = message.tabId;
    let events = canvasFingerprintingEvents[tabId] || [];
    sendResponse({ events: events });
  } else if (message.action === 'getCookieData') {
    let tabId = message.tabId;
    let cookies = cookieData[tabId] || [];
    sendResponse({ cookies: cookies });
  }
});

// Limpar dados quando a guia é atualizada ou fechada
browser.tabs.onRemoved.addListener(function(tabId) {
  delete thirdPartyDomains[tabId];
  delete potentialHijacks[tabId];
  delete localStorageUsage[tabId];
  delete canvasFingerprintingEvents[tabId];
  delete cookieData[tabId];
});

browser.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'loading') {
    delete thirdPartyDomains[tabId];
    delete potentialHijacks[tabId];
    delete localStorageUsage[tabId];
    delete canvasFingerprintingEvents[tabId];
    delete cookieData[tabId];
  }
});
