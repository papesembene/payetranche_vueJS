// Mock data for PayTranche landing page

export const recentPayments = [
  {
    id: '1',
    clientName: 'Amadou Diallo',
    amount: 50,
    status: 'payé',
    avatar: 'A'
  },
  {
    id: '2',
    clientName: 'Fatou Sall',
    amount: 75,
    status: 'en cours',
    avatar: 'F'
  },
  {
    id: '3',
    clientName: 'Moussa Kane',
    amount: 30,
    status: 'retard',
    avatar: 'M'
  }
];

export const dashboardStats = [
  {
    label: 'Total à recevoir',
    value: '2.5M FCFA',
    change: '+12% ce mois',
    type: 'success',
    metadata: ''
  },
  {
    label: 'En retard',
    value: '350K FCFA',
    type: 'danger',
    metadata: '5 clients'
  }
];

export const statistics = [
  {
    value: '500+',
    label: 'Commerçants actifs'
  },
  {
    value: '2.5M+',
    label: 'FCFA gérés par mois'
  },
  {
    value: '98%',
    label: 'Taux de satisfaction'
  }
];

export const features = [
  {
    icon: 'heart',
    title: 'Simple et intuitif',
    description: 'Interface facile à utiliser pour tous les commerçants'
  },
  {
    icon: 'shield',
    title: 'Sécurisé',
    description: 'Vos données sont protégées et sécurisées'
  },
  {
    icon: 'headphones',
    title: 'Support dédié',
    description: 'Une équipe à votre écoute pour vous accompagner'
  }
];