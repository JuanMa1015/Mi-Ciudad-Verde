/**
 * @typedef {Object} User
 * @property {string} uid
 * @property {string} email
 * @property {string} [displayName]
 */

/**
 * Crea un usuario de dominio desde el payload crudo (p.ej. Firebase).
 * @param {any} raw
 * @returns {User}
 */
export function createUser(raw) {
  return {
    uid: raw?.uid ?? '',
    email: raw?.email ?? '',
    displayName: raw?.displayName ?? '',
  };
}
