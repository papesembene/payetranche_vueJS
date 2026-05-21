const technicalPatterns = [
  /firebase/i,
  /auth\//i,
  /network-request-failed/i,
  /failed to fetch/i,
  /network error/i,
  /timeout/i,
  /axios/i,
  /internal server error/i,
  /request failed/i,
  /err_/i,
  /http\s?\d{3}/i,
  /successRedirectUrl/i,
  /\burl\b/i,
  /cors/i,
  /prisma/i,
  /database/i,
  /server/i,
  /stack/i
];

const authMessages = {
  'auth/network-request-failed': 'Connexion impossible pour le moment. Vérifiez votre internet puis réessayez.',
  'auth/popup-blocked': 'La fenêtre de connexion a été bloquée. Autorisez les fenêtres popup puis réessayez.',
  'auth/popup-closed-by-user': 'Connexion annulée. Réessayez quand vous êtes prêt.',
  'auth/cancelled-popup-request': 'Une connexion est déjà en cours. Fermez l’autre fenêtre puis réessayez.',
  'auth/operation-not-allowed': 'Cette méthode de connexion n’est pas encore disponible.',
  'auth/unauthorized-domain': 'La connexion n’est pas encore autorisée sur ce domaine.',
  'auth/account-exists-with-different-credential': 'Un compte existe déjà avec cet email. Essayez une autre méthode de connexion.',
  'auth/invalid-credential': 'Connexion impossible. Vérifiez la configuration puis réessayez.',
  'auth/invalid-app-id': 'Connexion Facebook indisponible pour le moment.',
  'auth/invalid-oauth-client-id': 'Connexion indisponible pour le moment.'
};

const fallbackByContext = {
  auth: 'Connexion impossible pour le moment. Réessayez dans quelques instants.',
  load: 'Chargement impossible pour le moment. Réessayez.',
  save: 'Enregistrement impossible pour le moment. Réessayez.',
  payment: 'Paiement non enregistré. Vérifiez puis réessayez.',
  admin: 'Action impossible pour le moment.',
  reminders: 'Relances indisponibles pour le moment. Réessayez.',
  default: 'Une erreur est survenue. Réessayez dans quelques instants.'
};

export const getUserFriendlyError = (error, context = 'default') => {
  if (error?.userMessage) return error.userMessage;

  const code = error?.code || error?.response?.data?.code || '';
  if (code && authMessages[code]) {
    return authMessages[code];
  }

  const status = error?.response?.status;
  if (status === 0 || error?.code === 'ERR_NETWORK') {
    return 'Connexion impossible pour le moment. Vérifiez votre internet puis réessayez.';
  }
  if (status === 401) return 'Votre session a expiré. Reconnectez-vous.';
  if (status === 403) return 'Vous n’avez pas accès à cette action.';
  if (status === 404) return 'Information introuvable.';
  if (status >= 500) return 'Service momentanément indisponible. Réessayez dans quelques instants.';

  const rawMessage = error?.response?.data?.message || error?.message || '';
  if (!rawMessage || technicalPatterns.some((pattern) => pattern.test(rawMessage))) {
    return fallbackByContext[context] || fallbackByContext.default;
  }

  return rawMessage;
};
