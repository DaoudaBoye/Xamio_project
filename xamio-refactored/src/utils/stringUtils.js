/**
 * utils/stringUtils.js
 * Utilitaires de manipulation de chaînes de caractères
 */

/**
 * Tronque une chaîne à une longueur max avec ellipsis
 */
export const truncate = (str, maxLength = 50) => {
  if (!str || str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}…`;
};

/**
 * Extrait les initiales d'un nom complet
 */
export const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

/**
 * Capitalise la première lettre
 */
export const capitalize = (str = '') =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
