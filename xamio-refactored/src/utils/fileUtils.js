/**
 * utils/fileUtils.js
 * Utilitaires pour la gestion des fichiers
 */

/**
 * Formate une taille de fichier en octets vers une string lisible
 */
export const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Retourne l'extension d'un nom de fichier en majuscules
 */
export const getFileExtension = (filename = '') => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'FILE';
};

/**
 * Vérifie si un type MIME est accepté
 */
export const isAcceptedFileType = (file, accepted = []) => {
  return accepted.some(type =>
    file.type === type || file.name.toLowerCase().endsWith(type.toLowerCase())
  );
};
