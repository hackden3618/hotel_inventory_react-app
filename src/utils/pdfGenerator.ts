import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Transaction, Debtor, Creditor } from '../database/db';

export async function generateLedgerPDF(
  businessName: string,
  transactions: Transaction[],
  debtors: Debtor[],
  creditors: Creditor[],
  periodText: string,
  summary: { totalDr: number; totalCr: number; openingBalance: number; trialBalance: number }
) {
  // Generate HTML for professional ledger table & Trial Balance
  const txnRows = transactions
    .map(t => {
      const isDr = t.type === 'expense' || t.type === 'purchase' || t.type === 'takeaway' || t.type === 'consumed';
      const drVal = isDr ? `KES ${t.amount.toLocaleString()}` : '';
      const crVal = !isDr ? `KES ${t.amount.toLocaleString()}` : '';
      const dateFormatted = new Date(t.date).toLocaleDateString('en-KE', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });

      return `
        <tr>
          <td>${dateFormatted}</td>
          <td>
            <strong>${t.title}</strong><br/>
            <small style="color: #666;">${t.description}</small>
          </td>
          <td style="color: #d35400; text-align: right;">${drVal}</td>
          <td style="color: #27ae60; text-align: right;">${crVal}</td>
          <td style="text-transform: capitalize; font-weight: 500;">${t.paymentMethod}</td>
        </tr>
      `;
    })
    .join('');

  const debtorRows = debtors
    .map(d => `
      <tr>
        <td>${d.name}</td>
        <td style="color: #c0392b; font-weight: 600;">KES ${d.totalOwed.toLocaleString()}</td>
        <td style="color: #27ae60;">KES ${d.totalPaid.toLocaleString()}</td>
        <td style="font-weight: 600;">KES ${(d.totalOwed - d.totalPaid).toLocaleString()}</td>
      </tr>
    `)
    .join('');

  const creditorRows = creditors
    .map(c => `
      <tr>
        <td>${c.name}</td>
        <td style="color: #d35400; font-weight: 600;">KES ${c.totalOwed.toLocaleString()}</td>
        <td style="color: #27ae60;">KES ${c.totalPaid.toLocaleString()}</td>
        <td style="font-weight: 600;">KES ${(c.totalOwed - c.totalPaid).toLocaleString()}</td>
      </tr>
    `)
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Ledger Report</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #2c3e50; padding: 20px; background-color: #fff; }
          .header { border-bottom: 2px solid #2ecc71; padding-bottom: 15px; margin-bottom: 25px; }
          .header h1 { font-size: 24px; font-weight: bold; margin: 0; color: #1e272c; text-transform: uppercase; }
          .header p { margin: 5px 0 0 0; color: #7f8c8d; font-size: 14px; }
          .summary-grid { display: flex; gap: 15px; margin-bottom: 25px; }
          .summary-card { flex: 1; padding: 12px 15px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; }
          .summary-card .lbl { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; margin-bottom: 4px; }
          .summary-card .val { font-size: 18px; font-weight: bold; color: #0f172a; }
          .section-title { font-size: 16px; font-weight: bold; color: #0f172a; border-left: 4px solid #2ecc71; padding-left: 8px; margin: 25px 0 12px 0; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background-color: #f1f5f9; color: #475569; font-weight: 600; text-align: left; font-size: 11px; text-transform: uppercase; padding: 10px; border-bottom: 1px solid #cbd5e1; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
          .trial-balance { background: #e8f8f5; border: 1px solid #a3e4d7; border-radius: 8px; padding: 15px; margin-bottom: 25px; }
          .trial-balance table { margin-bottom: 0; }
          .trial-balance th { background-color: rgba(46,204,113,0.1); color: #16a085; }
          .footer { text-align: center; margin-top: 40px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${businessName}</h1>
          <p>Professional Ledger & Trial Balance Report · Period: ${periodText}</p>
          <p style="font-size:11px; margin-top: 2px;">Generated on: ${new Date().toLocaleString()}</p>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="lbl">Opening Balance</div>
            <div class="val">KES ${summary.openingBalance.toLocaleString()}</div>
          </div>
          <div class="summary-card">
            <div class="lbl">Total Dr (Debits)</div>
            <div class="val" style="color:#d35400;">KES ${summary.totalDr.toLocaleString()}</div>
          </div>
          <div class="summary-card">
            <div class="lbl">Total Cr (Credits)</div>
            <div class="val" style="color:#27ae60;">KES ${summary.totalCr.toLocaleString()}</div>
          </div>
          <div class="summary-card">
            <div class="lbl">Trial Balance</div>
            <div class="val">KES ${summary.trialBalance.toLocaleString()}</div>
          </div>
        </div>

        <div class="section-title">Ledger Entries</div>
        <table>
          <thead>
            <tr>
              <th style="width: 15%;">Date</th>
              <th style="width: 45%;">Description</th>
              <th style="width: 15%; text-align: right;">Dr</th>
              <th style="width: 15%; text-align: right;">Cr</th>
              <th style="width: 10%;">Payment</th>
            </tr>
          </thead>
          <tbody>
            ${txnRows || '<tr><td colspan="5" style="text-align:center; color:#94a3b8;">No transactions found in this period.</td></tr>'}
          </tbody>
        </table>

        ${debtorRows.length > 0 ? `
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
          <tbody>
            ${debtorRows}
          </tbody>
        </table>
        ` : ''}

        ${creditorRows.length > 0 ? `
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
          <tbody>
            ${creditorRows}
          </tbody>
        </table>
        ` : ''}

        <div class="footer">
          This is an official ledger statement generated locally by the MealsLedger system.<br/>
          &copy; ${new Date().getFullYear()} ${businessName}. All rights reserved.
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Ledger Report' });
  } catch (error) {
    console.error("Failed to generate PDF:", error);
  }
}
