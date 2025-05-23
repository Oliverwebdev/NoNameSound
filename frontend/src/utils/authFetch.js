import { API_URL } from '../api';

/**
 * Universeller Auth-Fetch für deine API – nutzt Cookie-Auth,
 * kein Bearer-Header, kein Local Storage, kein Token-Handling mehr nötig!
 * 
 * @param {string} url Relativer API-Endpunkt, z.B. '/articles'
 * @param {object} options Fetch-Optionen (method, body, etc)
 * @returns {Promise<Response>}
 */
export async function authFetch(url, options = {}) {
  const response = await fetch(API_URL + url, {
    ...options,
    credentials: 'include', // Cookie wird mitgeschickt!
  });
  return response;
}

