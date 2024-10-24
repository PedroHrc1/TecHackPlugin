// Função para detectar potenciais ameaças de hijacking
function detectHijacking() {
    try {
      // Verifica scripts inline
      let scripts = document.querySelectorAll('script:not([src])');
      scripts.forEach(script => {
        if (script.innerText.length > 0) {
          let scriptContent = script.innerText;
  
          // Verifica se o script contém padrões suspeitos
          let suspiciousPatterns = [
            /eval\(/i,
            /document\.write\(/i,
            /setTimeout\([^,]+, *0\)/i,
            /window\.location/i,
            /window\.open\(/i,
            /<script/i,
            /<\/script>/i
          ];
  
          let isSuspicious = suspiciousPatterns.some(pattern => pattern.test(scriptContent));
  
          if (isSuspicious) {
            // Script suspeito encontrado
            browser.runtime.sendMessage({
              action: 'potentialHijackDetected',
              details: {
                url: window.location.href,
                scriptContent: scriptContent.substr(0, 200)
              }
            });
          }
        }
      });
    } catch (e) {
      console.error('Erro ao detectar hijacking:', e);
    }
  }
  
  // Função para detectar o uso de local storage
  function detectLocalStorageUsage() {
    try {
      let keys = Object.keys(localStorage);
      if (keys.length > 0) {
        browser.runtime.sendMessage({
          action: 'localStorageDetected',
          details: {
            url: window.location.href,
            storageKeys: keys
          }
        });
      }
    } catch (e) {
      console.error('Erro ao acessar o local storage:', e);
    }
  }
  
  // Função para detectar Canvas Fingerprinting
  function detectCanvasFingerprinting() {
    try {
      const scriptContent = `
        (function() {
          const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
          const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
          const originalMeasureText = CanvasRenderingContext2D.prototype.measureText;
  
          function notifyFingerprinting(methodName) {
            window.postMessage({
              source: 'canvas-fingerprint-detector',
              method: methodName,
              url: window.location.href
            }, '*');
          }
  
          HTMLCanvasElement.prototype.toDataURL = function() {
            notifyFingerprinting('toDataURL');
            return originalToDataURL.apply(this, arguments);
          };
  
          CanvasRenderingContext2D.prototype.getImageData = function() {
            notifyFingerprinting('getImageData');
            return originalGetImageData.apply(this, arguments);
          };
  
          CanvasRenderingContext2D.prototype.measureText = function() {
            notifyFingerprinting('measureText');
            return originalMeasureText.apply(this, arguments);
          };
        })();
      `;
  
      const script = document.createElement('script');
      script.textContent = scriptContent;
      (document.head || document.documentElement).appendChild(script);
      script.remove();
  
      window.addEventListener('message', function(event) {
        if (event.source !== window) return;
        if (event.data && event.data.source === 'canvas-fingerprint-detector') {
          browser.runtime.sendMessage({
            action: 'canvasFingerprintDetected',
            details: {
              url: event.data.url,
              method: event.data.method
            }
          });
        }
      });
    } catch (e) {
      console.error('Erro ao detectar Canvas Fingerprinting:', e);
    }
  }
  
  // Executa as detecções após o carregamento do DOM
  document.addEventListener('DOMContentLoaded', () => {
    detectHijacking();
    detectLocalStorageUsage();
    detectCanvasFingerprinting();
  });
  