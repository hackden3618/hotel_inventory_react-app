import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Transaction, Debtor, Creditor, getTransactionItems } from '../database/db';
import { Alert } from 'react-native';

export async function generateLedgerPDF(
  businessName: string,
  transactions: Transaction[],
  debtors: Debtor[],
  creditors: Creditor[],
  periodText: string,
  summary: { totalDr: number; totalCr: number; openingBalance: number; trialBalance: number }
) {
  const txnRows = transactions
    .map(t => {
      const isDr = ['expense', 'purchase', 'takeaway', 'consumed'].includes(t.type);
      const drVal = isDr ? `KES ${t.amount.toLocaleString()}` : '';
      const crVal = !isDr ? `KES ${t.amount.toLocaleString()}` : '';
      const dateFormatted = new Date(t.date).toLocaleDateString('en-KE', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Fetch line items for this transaction
      let lineItemsHtml = '';
      try {
        const items = getTransactionItems(t.id);
        if (items.length > 0) {
          lineItemsHtml = `<ul style="margin:4px 0 0 0; padding-left:14px; color:#666; font-size:10px;">
            ${items.map(i => `<li>${i.quantity}× ${i.mealName} @ KES ${i.unitPrice}</li>`).join('')}
          </ul>`;
        }
      } catch (_) { /* no items for this tx */ }

      return `
        <tr>
          <td style="white-space:nowrap">${dateFormatted}</td>
          <td>
            <strong>${t.title}</strong><br/>
            <small style="color:#666">${t.description}</small>
            ${lineItemsHtml}
          </td>
          <td style="color:#666; font-size:10px">${t.operant || '—'}</td>
          <td style="color:#d35400; text-align:right">${drVal}</td>
          <td style="color:#27ae60; text-align:right">${crVal}</td>
          <td style="text-transform:capitalize; font-weight:500">${t.paymentMethod}</td>
        </tr>
      `;
    })
    .join('');

  const debtorRows = debtors
    .map(d => `
      <tr>
        <td>${d.name}${d.phone ? `<br/><small style="color:#64748b">📞 ${d.phone}</small>` : ''}</td>
        <td style="color:#c0392b; font-weight:600">KES ${d.totalOwed.toLocaleString()}</td>
        <td style="color:#27ae60">KES ${d.totalPaid.toLocaleString()}</td>
        <td style="font-weight:600">KES ${(d.totalOwed - d.totalPaid).toLocaleString()}</td>
      </tr>
    `)
    .join('');

  const creditorRows = creditors
    .map(c => `
      <tr>
        <td>${c.name}${c.phone ? `<br/><small style="color:#64748b">📞 ${c.phone}</small>` : ''}</td>
        <td style="color:#d35400; font-weight:600">KES ${c.totalOwed.toLocaleString()}</td>
        <td style="color:#27ae60">KES ${c.totalPaid.toLocaleString()}</td>
        <td style="font-weight:600">KES ${(c.totalOwed - c.totalPaid).toLocaleString()}</td>
      </tr>
    `)
    .join('');

  const trialBalanceStatus = summary.trialBalance >= 0
    ? `<span style="color:#27ae60">✓ Credit Balance</span>`
    : `<span style="color:#e74c3c">⚠ Debit Deficit</span>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Ledger Report — ${businessName}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #2c3e50; padding: 24px; background: #fff; }
          .header { border-bottom: 3px solid #2ecc71; padding-bottom: 16px; margin-bottom: 24px; }
          .header h1 { font-size: 22px; font-weight: bold; margin: 0; color: #1e272c; text-transform: uppercase; letter-spacing: 1px; }
          .header p { margin: 4px 0 0 0; color: #7f8c8d; font-size: 13px; }
          .summary-grid { display: flex; gap: 12px; margin-bottom: 24px; }
          .summary-card { flex: 1; padding: 12px 14px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; }
          .summary-card .lbl { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px; letter-spacing: 0.5px; }
          .summary-card .val { font-size: 17px; font-weight: bold; color: #0f172a; }
          .section-title { font-size: 13px; font-weight: bold; color: #0f172a; border-left: 4px solid #2ecc71; padding-left: 8px; margin: 24px 0 10px 0; text-transform: uppercase; letter-spacing: 0.8px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 11px; }
          th { background: #f1f5f9; color: #475569; font-weight: 700; text-align: left; font-size: 10px; text-transform: uppercase; padding: 8px 10px; border-bottom: 1px solid #cbd5e1; letter-spacing: 0.4px; }
          td { padding: 9px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
          .trial-row { background: #e8f8f5; font-weight: bold; }
          .footer { text-align: center; margin-top: 36px; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${businessName}</h1>
          <p>Professional Double-Entry Ledger &amp; Trial Balance · Period: ${periodText}</p>
          <p style="font-size:10px; margin-top:2px; color:#94a3b8">Generated: ${new Date().toLocaleString('en-KE')}</p>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="lbl">Opening Balance</div>
            <div class="val">KES ${summary.openingBalance.toLocaleString()}</div>
          </div>
          <div class="summary-card">
            <div class="lbl">Total Debits (Dr)</div>
            <div class="val" style="color:#d35400">KES ${summary.totalDr.toLocaleString()}</div>
          </div>
          <div class="summary-card">
            <div class="lbl">Total Credits (Cr)</div>
            <div class="val" style="color:#27ae60">KES ${summary.totalCr.toLocaleString()}</div>
          </div>
          <div class="summary-card">
            <div class="lbl">Trial Balance</div>
            <div class="val">KES ${summary.trialBalance.toLocaleString()}</div>
            <div style="font-size:10px; margin-top:3px">${trialBalanceStatus}</div>
          </div>
        </div>

        <div class="section-title">Ledger Entries</div>
        <table>
          <thead>
            <tr>
              <th style="width:12%">Date</th>
              <th style="width:38%">Description / Line Items</th>
              <th style="width:10%">Operant</th>
              <th style="width:14%; text-align:right">Dr</th>
              <th style="width:14%; text-align:right">Cr</th>
              <th style="width:12%">Payment</th>
            </tr>
          </thead>
          <tbody>
            ${txnRows || '<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:20px">No transactions in this period.</td></tr>'}
          </tbody>
          <tfoot>
            <tr class="trial-row">
              <td colspan="3" style="text-align:right; font-size:10px; color:#475569; text-transform:uppercase; letter-spacing:0.5px">Totals</td>
              <td style="text-align:right; color:#d35400">KES ${summary.totalDr.toLocaleString()}</td>
              <td style="text-align:right; color:#27ae60">KES ${summary.totalCr.toLocaleString()}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        ${debtors.filter(d => d.totalOwed - d.totalPaid > 0).length > 0 ? `
        <div class="section-title">Debtors Ledger</div>
        <table>
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Total Owed</th>
              <th>Total Paid</th>
              <th>Remaining Balance</th>
            </tr>
          </thead>
          <tbody>${debtorRows}</tbody>
        </table>` : ''}

        ${creditors.filter(c => c.totalOwed - c.totalPaid > 0).length > 0 ? `
        <div class="section-title">Creditors Ledger</div>
        <table>
          <thead>
            <tr>
              <th>Supplier Name</th>
              <th>We Owe</th>
              <th>We Paid</th>
              <th>Outstanding Balance</th>
            </tr>
          </thead>
          <tbody>${creditorRows}</tbody>
        </table>` : ''}

        <div class="footer">
          Official ledger statement generated by ${businessName} Management System.<br/>
          &copy; ${new Date().getFullYear()} ${businessName}. All rights reserved.
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `${businessName} — Ledger Report`,
    });
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    Alert.alert('Failed to generate PDF:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}
