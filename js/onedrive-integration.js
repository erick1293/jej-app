/*
 * OneDrive backup integration for ANFO, Emulsión, Perforación and Reducción.
 *
 * Requirements:
 * 1) Load MSAL Browser before this file, for example:
 *    <script src="https://alcdn.msauth.net/browser/2.38.3/js/msal-browser.min.js"></script>
 * 2) Register a Single-page application in Microsoft Entra ID and replace
 *    clientId below with its Application (client) ID. A Gmail address is not
 *    an application ID; the example account is only used as a login hint.
 * 3) Add the exact site origin as a Redirect URI in that app registration.
 * 4) For customized app data, define window.APP_DATA_PROVIDER = () => ({ ... }).
 *
 * Upload destination: OneDrive/ArchivosSubidoapp/{anfo,emulsion,perforacion,reduccion}/
 */
(function () {
  'use strict';

  const CONFIG = {
    clientId: 'REEMPLAZAR_POR_APPLICATION_CLIENT_ID',
    authority: 'https://login.microsoftonline.com/consumers',
    redirectUri: window.location.origin + window.location.pathname,
    loginHint: 'onedrive.test14234141.@gmail.com', // Ejemplo solicitado; cambiar por la cuenta real.
    rootFolder: 'ArchivosSubidoapp',
    scopes: ['Files.ReadWrite'],
    buttonId: 'btn-subir-onedrive'
  };

  const SECTION_ALIASES = {
    anfo: 'anfo',
    emulsion: 'emulsion',
    emulsión: 'emulsion',
    perforacion: 'perforacion',
    perforación: 'perforacion',
    reduccion: 'reduccion',
    reducción: 'reduccion',
    reducion: 'reduccion'
  };

  let msalClient;

  function currentSection() {
    const fromBody = document.body && document.body.dataset.section;
    const fromMeta = document.querySelector('meta[name="app-section"]')?.content;
    const fromPath = window.location.pathname.split('/').pop().replace(/\.html?$/i, '');
    const key = String(fromBody || fromMeta || fromPath || '').trim().toLowerCase();
    return SECTION_ALIASES[key] || null;
  }

  function getMsalClient() {
    if (!window.msal || !window.msal.PublicClientApplication) {
      throw new Error('No se encontró MSAL. Carga msal-browser antes de onedrive-integration.js.');
    }
    if (CONFIG.clientId === 'REEMPLAZAR_POR_APPLICATION_CLIENT_ID') {
      throw new Error('Configura CONFIG.clientId con el Application (client) ID de Microsoft Entra.');
    }
    if (!msalClient) {
      msalClient = new window.msal.PublicClientApplication({
        auth: {
          clientId: CONFIG.clientId,
          authority: CONFIG.authority,
          redirectUri: CONFIG.redirectUri
        },
        cache: { cacheLocation: 'sessionStorage' }
      });
    }
    return msalClient;
  }

  async function getAccessToken() {
    const client = getMsalClient();
    await client.initialize();
    const redirect = await client.handleRedirectPromise();
    let account = redirect?.account || client.getActiveAccount() || client.getAllAccounts()[0];

    if (!account) {
      const login = await client.loginPopup({
        scopes: CONFIG.scopes,
        loginHint: CONFIG.loginHint
      });
      account = login.account;
      client.setActiveAccount(account);
    }

    try {
      const result = await client.acquireTokenSilent({ account, scopes: CONFIG.scopes });
      return result.accessToken;
    } catch (error) {
      if (error instanceof window.msal.InteractionRequiredAuthError) {
        const result = await client.acquireTokenPopup({ account, scopes: CONFIG.scopes });
        return result.accessToken;
      }
      throw error;
    }
  }

  async function graphRequest(path, token, options) {
    const response = await fetch('https://graph.microsoft.com/v1.0' + path, {
      ...options,
      headers: {
        Authorization: 'Bearer ' + token,
        ...(options && options.headers)
      }
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error('Microsoft Graph respondió ' + response.status + ': ' + detail);
    }
    return response.status === 204 ? null : response.json();
  }

  async function ensureFolder(parentPath, folderName, token) {
    const safeName = encodeURIComponent(folderName);
    const lookupPath = parentPath
      ? '/me/drive/root:/' + parentPath + '/' + safeName
      : '/me/drive/root:/' + safeName;
    const lookup = await fetch('https://graph.microsoft.com/v1.0' + lookupPath, {
      headers: { Authorization: 'Bearer ' + token }
    });

    if (lookup.ok) return lookup.json();
    if (lookup.status !== 404) {
      throw new Error('No se pudo consultar la carpeta "' + folderName + '" (HTTP ' + lookup.status + ').');
    }

    const createPath = parentPath
      ? '/me/drive/root:/' + parentPath + ':/children'
      : '/me/drive/root/children';
    return graphRequest(createPath, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: folderName,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'fail'
      })
    });
  }

  function snapshotPageData(section) {
    const supplied = typeof window.APP_DATA_PROVIDER === 'function'
      ? window.APP_DATA_PROVIDER()
      : null;
    const formData = {};
    document.querySelectorAll('input, select, textarea').forEach((field) => {
      if (!field.name && !field.id) return;
      if (field.type === 'password' || field.type === 'file' || field.type === 'button' || field.type === 'submit') return;
      if ((field.type === 'checkbox' || field.type === 'radio') && !field.checked) return;
      const key = field.name || field.id;
      const value = field.type === 'checkbox' ? true : field.value;
      if (Object.prototype.hasOwnProperty.call(formData, key)) {
        formData[key] = Array.isArray(formData[key]) ? [...formData[key], value] : [formData[key], value];
      } else {
        formData[key] = value;
      }
    });

    const localData = {};
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      try { localData[key] = JSON.parse(localStorage.getItem(key)); }
      catch (_) { localData[key] = localStorage.getItem(key); }
    }

    return {
      app: 'jejapp',
      section,
      exportedAt: new Date().toISOString(),
      page: window.location.href,
      data: supplied ?? { formData, localStorage: localData }
    };
  }

  async function subirArchivoOneDrive() {
    const section = currentSection();
    if (!section) {
      throw new Error('No pude determinar la sección. Usa data-section="anfo|emulsion|perforacion|reduccion" en <body>.');
    }

    const token = await getAccessToken();
    await ensureFolder('', CONFIG.rootFolder, token);
    await ensureFolder(CONFIG.rootFolder, section, token);

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = section + '-respaldo-' + stamp + '.json';
    const folderPath = CONFIG.rootFolder + '/' + section;
    const content = JSON.stringify(snapshotPageData(section), null, 2);
    const uploadPath = '/me/drive/root:/' + folderPath + '/' + encodeURIComponent(fileName) + ':/content';

    return graphRequest(uploadPath, token, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: content
    });
  }

  function initCharts() {
    // Los gráficos deben recibir los datos reales de cada pantalla. Este archivo
    // no crea gráficos con cifras de ejemplo para evitar mostrar datos ficticios.
    if (typeof window.initCharts === 'function' && window.initCharts !== initCharts) {
      window.initCharts();
    }
  }

  function initOneDriveButton() {
    const button = document.getElementById(CONFIG.buttonId);
    if (!button) return;

    button.addEventListener('click', async () => {
      const originalHtml = button.innerHTML;
      try {
        button.disabled = true;
        button.textContent = 'Subiendo respaldo… ☁️';
        const uploaded = await subirArchivoOneDrive();
        window.alert('Respaldo guardado en OneDrive: ' + uploaded.name);
      } catch (error) {
        console.error('Error al subir el respaldo a OneDrive:', error);
        window.alert('No se pudo subir el respaldo. ' + error.message);
      } finally {
        button.disabled = false;
        button.innerHTML = originalHtml;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    initOneDriveButton();
  });

  // Expone la operación por si la interfaz necesita invocarla desde otro botón.
  window.subirArchivoOneDrive = subirArchivoOneDrive;
})();
