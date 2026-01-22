// Export clients to CSV
export const exportClientsToExcel = (clients, filename = 'clients') => {
  if (clients.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }

  const headers = ['Nom', 'Téléphone', 'Adresse', 'Dette Totale (FCFA)', 'Montant Payé (FCFA)', 'Reste à Payer (FCFA)', 'Progression (%)', 'Statut', 'Nombre de Transactions'];
  const data = clients.map(client => [
    client.name,
    client.phone,
    client.address,
    client.total || 0,
    client.paid || 0,
    client.remaining || 0,
    client.progress || 0,
    client.status,
    client.historyCount || 0
  ]);

  exportToCSV([headers, ...data], filename);
};

// Export payments to CSV
export const exportPaymentsToExcel = (payments, filename = 'paiements') => {
  if (payments.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }

  const headers = ['Client', 'Montant (FCFA)', 'Tranche', 'Date', 'Statut'];
  const data = payments.map(payment => [
    payment.client,
    payment.amount.replace(' FCFA', '').replace(/\s/g, ''),
    payment.tranche,
    payment.date,
    payment.status
  ]);

  exportToCSV([headers, ...data], filename);
};

// Generate client statement (simple text format)
export const generateClientStatementPDF = (client, transactions) => {
  let content = `RELEVE CLIENT\n\n`;
  content += `Client: ${client.name}\n`;
  content += `Téléphone: ${client.phone}\n`;
  content += `Adresse: ${client.address}\n`;
  content += `Date: ${new Date().toLocaleDateString('fr-FR')}\n\n`;

  content += `TRANSACTIONS:\n`;
  content += `Date\t\tMontant\t\tStatut\t\tDescription\n`;
  content += `----\t\t-------\t\t------\t\t-----------\n`;

  transactions.forEach(t => {
    const date = new Date(t.createdAt).toLocaleDateString('fr-FR');
    const amount = `${t.amount.toLocaleString('fr-FR')} FCFA`;
    const status = t.status === 'completed' ? 'Payé' : 'En attente';
    const desc = t.description || '';
    content += `${date}\t${amount}\t${status}\t${desc}\n`;
  });

  // Summary
  const totalPaid = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  content += `\nRESUME:\n`;
  content += `Total payé: ${totalPaid.toLocaleString('fr-FR')} FCFA\n`;
  content += `Reste à payer: ${(client.totalDebt - totalPaid).toLocaleString('fr-FR')} FCFA\n`;

  downloadAsText(content, `releve-${client.name.replace(/\s+/g, '-').toLowerCase()}.txt`);
};

// Generate general report (text format)
export const generateReportPDF = (title, data, filename) => {
  let content = `${title.toUpperCase()}\n\n`;
  content += `Généré le: ${new Date().toLocaleDateString('fr-FR')}\n\n`;

  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    content += headers.join('\t') + '\n';
    content += headers.map(() => '----').join('\t') + '\n';

    data.forEach(row => {
      content += headers.map(header => row[header]).join('\t') + '\n';
    });
  }

  downloadAsText(content, `${filename}.txt`);
};

// Export transaction history
export const exportTransactionHistory = (transactions, filename = 'historique-transactions') => {
  if (transactions.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }

  const headers = ['ID Transaction', 'Client', 'Montant (FCFA)', 'Statut', 'Date Création', 'Date Échéance', 'Description'];
  const data = transactions.map(t => [
    t.id,
    t.clientName || 'N/A',
    t.amount,
    t.status === 'completed' ? 'Payé' : t.status === 'pending' ? 'En attente' : t.status,
    new Date(t.createdAt).toLocaleDateString('fr-FR'),
    t.dueDate ? new Date(t.dueDate).toLocaleDateString('fr-FR') : 'N/A',
    t.description || ''
  ]);

  exportToCSV([headers, ...data], filename);
};

// Utility function to export as CSV
function exportToCSV(data, filename) {
  const csvContent = data.map(row =>
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Utility function to download as text file
function downloadAsText(content, filename) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}