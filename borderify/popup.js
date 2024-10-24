document.addEventListener('DOMContentLoaded', () => {
    // Obtém a guia ativa
    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
      let tabId = tabs[0].id;
  
      // Envia uma mensagem ao background.js para obter os domínios de terceiros
      browser.runtime.sendMessage({ action: 'getThirdPartyDomains', tabId: tabId }).then(response => {
        let domains = response.domains;
  
        let list = document.getElementById('domain-list');
  
        if (domains && domains.length > 0) {
          domains.forEach(domain => {
            let li = document.createElement('li');
            li.textContent = domain;
            list.appendChild(li);
          });
        } else {
          let li = document.createElement('li');
          li.textContent = 'Nenhum domínio de terceiro detectado.';
          list.appendChild(li);
        }
      });
    });
  });
  