/**
 * Correspondance entre les noms sémantiques et les variables CSS.
 * Utilisé par les composants Badge, Button, etc.
 */

export const STATUS_COLORS = {
  blue: {
    background:  'var(--color-accent-bg)',
    color:       'var(--color-accent)',
    borderColor: 'var(--color-accent-border)',
  },
  green: {
    background:  'var(--color-success-bg)',
    color:       'var(--color-success)',
    borderColor: 'var(--color-success-border)',
  },
  yellow: {
    background:  'var(--color-warning-bg)',
    color:       'var(--color-warning)',
    borderColor: 'var(--color-warning-border)',
  },
  red: {
    background:  'var(--color-danger-bg)',
    color:       'var(--color-danger)',
    borderColor: 'var(--color-danger-border)',
  },
  purple: {
    background:  'var(--color-purple-bg)',
    color:       'var(--color-purple)',
    borderColor: 'var(--color-purple-border)',
  },
  neutral: {
    background:  'var(--color-background-elevated)',
    color:       'var(--color-text-secondary)',
    borderColor: 'var(--color-border-medium)',
  },
};

// Alias pour les anciens noms
STATUS_COLORS.ochre   = STATUS_COLORS.yellow;
STATUS_COLORS.sage    = STATUS_COLORS.green;
STATUS_COLORS.clay    = STATUS_COLORS.red;
STATUS_COLORS.slate   = STATUS_COLORS.blue;
STATUS_COLORS.plum    = STATUS_COLORS.purple;
STATUS_COLORS.muted   = STATUS_COLORS.neutral;
STATUS_COLORS.success = STATUS_COLORS.green;
STATUS_COLORS.warning = STATUS_COLORS.yellow;
STATUS_COLORS.danger  = STATUS_COLORS.red;
STATUS_COLORS.info    = STATUS_COLORS.blue;

export const MEETING_STATUS_COLORS = {
  upcoming:  STATUS_COLORS.blue,
  done:      STATUS_COLORS.green,
  cancelled: STATUS_COLORS.red,
  postponed: STATUS_COLORS.yellow,
};
