document.addEventListener('DOMContentLoaded', () => {
    // Variáveis para pontuação de privacidade e deduções
    let score = 100;
    let deductions = [];
  
    // Obtém a guia ativa
    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
      let tabId = tabs[0].id;
  
      // Solicita os dados dos cookies
      browser.runtime.sendMessage({ action: 'getCookieData', tabId: tabId }).then(response => {
        let cookies = response.cookies;
  
        let firstPartyCookies = 0;
        let thirdPartyCookies = 0;
        let sessionCookies = 0;
        let persistentCookies = 0;
  
        cookies.forEach(cookie => {
          if (cookie.isFirstParty) {
            firstPartyCookies++;
          } else {
            thirdPartyCookies++;
          }
  
          if (cookie.isSession) {
            sessionCookies++;
          } else {
            persistentCookies++;
          }
        });
  
        let cookieList = document.getElementById('cookie-list');
  
        let summary = `Total de Cookies: ${cookies.length}`;
        summary += `, Primeira parte: ${firstPartyCookies}`;
        summary += `, Terceira parte: ${thirdPartyCookies}`;
        summary += `, Sessão: ${sessionCookies}`;
        summary += `, Persistentes: ${persistentCookies}`;
  
        let summaryElement = document.createElement('p');
        summaryElement.textContent = summary;
        cookieList.appendChild(summaryElement);
  
        // Dedução de pontos com base nos cookies
        if (thirdPartyCookies > 0) {
          let deduction = Math.min(thirdPartyCookies * 2, 10);
          score -= deduction;
          deductions.push(`- ${deduction} pontos por cookies de terceiros.`);
        }
  
        if (persistentCookies > 0) {
          let deduction = Math.min(persistentCookies * 1, 5);
          score -= deduction;
          deductions.push(`- ${deduction} pontos por cookies persistentes.`);
        }
  
        // Atualiza a pontuação de privacidade e deduções
        updatePrivacyScore();
      });
  
      // Solicita os domínios de terceiros
      browser.runtime.sendMessage({ action: 'getThirdPartyDomains', tabId: tabId }).then(response => {
        let domains = response.domains;
  
        let domainList = document.getElementById('domain-list');
  
        if (domains && domains.length > 0) {
          domains.forEach(domain => {
            let li = document.createElement('li');
            li.textContent = domain;
            domainList.appendChild(li);
          });
  
          // Dedução de pontos
          let domainDeduction = Math.min(domains.length * 5, 30);
          score -= domainDeduction;
          deductions.push(`- ${domainDeduction} pontos por domínios de terceiros.`);
  
          // Atualiza a pontuação
          updatePrivacyScore();
        } else {
          let li = document.createElement('li');
          li.textContent = 'Nenhum domínio de terceiro detectado.';
          domainList.appendChild(li);
        }
      });
  
      // Solicita as potenciais ameaças de hijacking
      browser.runtime.sendMessage({ action: 'getPotentialHijacks', tabId: tabId }).then(response => {
        let hijacks = response.hijacks;
  
        let hijackList = document.getElementById('hijack-list');
  
        if (hijacks && hijacks.length > 0) {
          hijacks.forEach(hijack => {
            let li = document.createElement('li');
            li.textContent = `Ameaça detectada em ${hijack.url}`;
            hijackList.appendChild(li);
          });
  
          // Dedução de pontos
          score -= 20;
          deductions.push('- 20 pontos por ameaças de hijacking.');
  
          // Atualiza a pontuação
          updatePrivacyScore();
        } else {
          let li = document.createElement('li');
          li.textContent = 'Nenhuma ameaça de hijacking detectada.';
          hijackList.appendChild(li);
        }
      });
  
      // Solicita as informações de uso do local storage
      browser.runtime.sendMessage({ action: 'getLocalStorageUsage', tabId: tabId }).then(response => {
        let usage = response.usage;
  
        let storageList = document.getElementById('storage-list');
  
        if (usage && usage.storageKeys.length > 0) {
          usage.storageKeys.forEach(key => {
            let li = document.createElement('li');
            li.textContent = key;
            storageList.appendChild(li);
          });
  
          // Dedução de pontos
          score -= 15;
          deductions.push('- 15 pontos por uso de local storage.');
  
          // Atualiza a pontuação
          updatePrivacyScore();
        } else {
          let li = document.createElement('li');
          li.textContent = 'Nenhum dado armazenado no local storage.';
          storageList.appendChild(li);
        }
      });
  
      // Solicita os eventos de Canvas Fingerprinting
      browser.runtime.sendMessage({ action: 'getCanvasFingerprintingEvents', tabId: tabId }).then(response => {
        let events = response.events;
  
        let canvasList = document.getElementById('canvas-list');
  
        if (events && events.length > 0) {
          events.forEach(event => {
            let li = document.createElement('li');
            li.textContent = `Método ${event.method} chamado em ${event.url}`;
            canvasList.appendChild(li);
          });
  
          // Dedução de pontos
          score -= 25;
          deductions.push('- 25 pontos por uso de Canvas Fingerprinting.');
  
          // Atualiza a pontuação
          updatePrivacyScore();
        } else {
          let li = document.createElement('li');
          li.textContent = 'Nenhuma atividade de Canvas Fingerprinting detectada.';
          canvasList.appendChild(li);
        }
      });
  
      function updatePrivacyScore() {
        let scoreElement = document.getElementById('privacy-score');
        score = Math.max(score, 0); // Garante que a pontuação não seja negativa
        scoreElement.textContent = `Pontuação de Privacidade: ${score}/100`;
  
        // Determina a avaliação
        let evaluation = '';
        if (score >= 80) {
          evaluation = 'Ótimo - A página respeita a privacidade.';
        } else if (score >= 60) {
          evaluation = 'Bom - A página tem algumas práticas que podem afetar a privacidade.';
        } else if (score >= 40) {
          evaluation = 'Regular - A página apresenta várias práticas que afetam a privacidade.';
        } else {
          evaluation = 'Ruim - A página não respeita a privacidade do usuário.';
        }
  
        let evaluationElement = document.getElementById('privacy-evaluation');
        evaluationElement.textContent = evaluation;
  
        // Exibe as deduções
        let deductionsList = document.getElementById('deductions-list');
        deductionsList.innerHTML = ''; // Limpa deduções anteriores
        deductions.forEach(deduction => {
          let li = document.createElement('li');
          li.textContent = deduction;
          deductionsList.appendChild(li);
        });
      }
    });
  });
  