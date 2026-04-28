/**
 * utils/dateUtils.js
 * Utilitaires de formatage et manipulation de dates
 */

export const MONTHS_FR = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
];

export const DAYS_FR = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

/**
 * Formate une date ISO en string lisible
 * @param {string} isoDate - "2026-03-27"
 * @returns {string} "27/03/2026"
 */
export const formatDate = (isoDate) => {
  if (!isoDate) return '—';
  return isoDate.split('-').reverse().join('/');
};

/**
 * Retourne le nombre de jours dans un mois
 */
export const getDaysInMonth = (year, month) =>
  new Date(year, month + 1, 0).getDate();

/**
 * Retourne le premier jour de la semaine du mois (Lun=0)
 */
export const getFirstDayOfMonth = (year, month) => {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
};

/**
 * Vérifie si une date correspond à aujourd'hui
 */
export const isToday = (year, month, day) => {
  const now = new Date();
  return year === now.getFullYear() && month === now.getMonth() && day === now.getDate();
};
