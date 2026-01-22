// Plans d'abonnement et fonctions utilitaires
export const subscriptionPlans = {
  free: {
    id: 'free',
    name: 'Essai gratuit',
    price: 0,
    currency: 'FCFA',
    billing: 'mensuel',
    limits: { maxClients: 5, maxPayments: 50, maxPaymentAmount: 100000 },
    features: ['basic_dashboard', 'client_management', 'payment_tracking'],
    description: 'Essai gratuit de 14 jours'
  },
  essential: {
    id: 'essential',
    name: 'Essentiel',
    price: 5000,
    currency: 'FCFA',
    billing: 'mensuel',
    limits: { maxClients: 50, maxPayments: 500, maxPaymentAmount: 500000 },
    features: ['basic_dashboard', 'client_management', 'payment_tracking', 'payment_reminders', 'basic_reports', 'email_support'],
    description: 'Pour les petits commerçants'
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 15000,
    currency: 'FCFA',
    billing: 'mensuel',
    limits: { maxClients: 200, maxPayments: 2000, maxPaymentAmount: 2000000 },
    features: ['all_essential', 'advanced_analytics', 'api_access', 'priority_support', 'custom_reminders', 'export_data'],
    description: 'Pour les entreprises en croissance'
  },
  enterprise: {
    id: 'enterprise',
    name: 'Entreprise',
    price: 50000,
    currency: 'FCFA',
    billing: 'mensuel',
    limits: { maxClients: -1, maxPayments: -1, maxPaymentAmount: -1 },
    features: ['all_pro', 'custom_integrations', 'white_label', 'dedicated_support', 'multi_user', 'advanced_security'],
    description: 'Pour les grandes organisations'
  }
};

// Vérifier les limites d'utilisation
export const checkLimits = (planId, usage) => {
  const plan = subscriptionPlans[planId];
  if (!plan?.limits || !usage) return { valid: true, violations: [] };

  const violations = [];

  if (plan.limits.maxClients !== -1 && usage.clients > plan.limits.maxClients) {
    violations.push(`Limite de clients dépassée (${usage.clients}/${plan.limits.maxClients})`);
  }

  if (plan.limits.maxPayments !== -1 && usage.payments > plan.limits.maxPayments) {
    violations.push(`Limite de paiements dépassée (${usage.payments}/${plan.limits.maxPayments})`);
  }

  if (plan.limits.maxPaymentAmount !== -1 && usage.totalAmount > plan.limits.maxPaymentAmount) {
    violations.push(`Montant maximum dépassé (${usage.totalAmount}/${plan.limits.maxPaymentAmount} FCFA)`);
  }

  return {
    valid: violations.length === 0,
    violations
  };
};

// Vérifier si un plan a une fonctionnalité
export const hasFeature = (planId, feature) => {
  const plan = subscriptionPlans[planId];
  if (!plan?.features) return false;

  if (plan.features.includes(feature)) return true;
  if (plan.features.includes('all_essential') && subscriptionPlans.essential?.features?.includes(feature)) return true;
  if (plan.features.includes('all_pro') &&
      (subscriptionPlans.pro?.features?.includes(feature) || subscriptionPlans.essential?.features?.includes(feature))) return true;

  return false;
};