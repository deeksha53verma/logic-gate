import * as htmlToImage from 'html-to-image';

/**
 * Exports data as a downloadable JSON file.
 */
export function exportAsJSON(data, filename = 'circuit_design.json') {
  try {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } catch (error) {
    console.error('Failed to export JSON:', error);
  }
}

/**
 * Captures a DOM element and downloads it as a PNG image.
 */
export function exportAsPNG(element, filename = 'pcb_layout.png') {
  const target = element?.current || element;
  if (!target) {
    console.error('Invalid element ref for PNG export.');
    return Promise.reject('Invalid element');
  }

  return htmlToImage.toPng(target, { cacheBust: true })
    .then(dataUrl => {
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
    })
    .catch(error => {
      console.error('Error generating PNG capture:', error);
    });
}

/**
 * Opens a print dialog with the generated engineering HTML report.
 */
export function exportAsPDF(reportHTML) {
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocker is preventing the report window from opening.');
      return;
    }
    printWindow.document.write(reportHTML);
    printWindow.document.close();
    printWindow.focus();
    
    // Give document time to load assets/styles before popping up print prompt
    setTimeout(() => {
      printWindow.print();
    }, 600);
  } catch (error) {
    console.error('Failed to export PDF:', error);
  }
}

/**
 * Generates the print-ready HTML representation of the logic design.
 */
export function generateCircuitReport(expression, winnerMapping, implementations, scoredCandidates) {
  const dateStr = new Date().toLocaleString();

  // Create table rows for implementations
  const implRows = implementations.map(impl => `
    <tr>
      <td><strong>${impl.label}</strong></td>
      <td>${impl.totalGates}</td>
      <td>${impl.totalICs}</td>
      <td>${impl.unusedGates}</td>
      <td>${impl.totalDelay} ns</td>
      <td>${impl.totalPower} mW</td>
      <td>$${impl.totalCost.toFixed(2)}</td>
    </tr>
  `).join('');

  // Create table rows for candidates
  const candRows = scoredCandidates.map(c => `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td>${c.finalScore.toFixed(1)}</td>
      <td>${c.isWinner ? '🏆 Winner' : 'Runner-up'}</td>
    </tr>
  `).join('');

  // Create IC inventory list
  const icInventory = winnerMapping.ics.map(ic => `
    <li><strong>${ic.id}</strong> (${ic.name}): ${ic.usedSlots}/${ic.totalSlots} slots used</li>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Logic Gate Synthesizer — EDA Engineering Report</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #334155;
          margin: 40px;
          line-height: 1.6;
        }
        .header {
          border-bottom: 2px solid #0f172a;
          padding-bottom: 12px;
          margin-bottom: 30px;
        }
        h1 { margin: 0 0 8px 0; color: #0f172a; font-size: 26px; }
        h2 { border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; color: #1e293b; font-size: 18px; margin-top: 30px; }
        .meta { font-size: 12px; color: #64748b; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; }
        th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; font-size: 13px; }
        th { background-color: #f8fafc; color: #0f172a; font-weight: 700; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .recommendation {
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 30px;
        }
        .recommendation h3 { margin: 0 0 6px 0; color: #15803d; font-size: 16px; }
        ul { margin: 10px 0; padding-left: 20px; font-size: 13px; }
        li { margin-bottom: 4px; }
        .footer {
          margin-top: 50px;
          border-top: 1px solid #e2e8f0;
          padding-top: 10px;
          font-size: 11px;
          color: #94a3b8;
          text-align: center;
        }
        @media print {
          body { margin: 20px; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Logic Gate Synthesizer — EDA Engineering Report</h1>
        <div class="meta">Generated on: ${dateStr} | Target Expression: <strong>${expression}</strong></div>
      </div>

      <div class="recommendation">
        <h3>💡 Engineering Recommendation</h3>
        <p style="margin: 0; font-size: 13px;">
          The decision engine recommends the <strong>${winnerMapping.label}</strong> strategy for manufacturing. 
          This mapping uses a total of <strong>${winnerMapping.totalICs} ICs</strong> with an estimated PCB area of 
          <strong>${winnerMapping.estimatedPCBArea} cm²</strong>, typical propagation delay of <strong>${winnerMapping.totalDelay} ns</strong>, 
          and total power consumption of <strong>${winnerMapping.totalPower} mW</strong>.
        </p>
      </div>

      <h2>1. IC Mapping Strategy Comparison</h2>
      <table>
        <thead>
          <tr>
            <th>Strategy Name</th>
            <th>Gates</th>
            <th>ICs Used</th>
            <th>Unused Slots</th>
            <th>Propagation Delay</th>
            <th>Power Consumption</th>
            <th>Estimated Cost</th>
          </tr>
        </thead>
        <tbody>
          ${implRows}
        </tbody>
      </table>

      <h2>2. Assigned Physical IC Inventory</h2>
      <ul>
        ${icInventory}
      </ul>

      <h2>3. Synthesis Algorithm Ranking (Multi-Criteria Heuristic)</h2>
      <table>
        <thead>
          <tr>
            <th>Algorithm Candidate</th>
            <th>Heuristic Score (Lower is Better)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${candRows}
        </tbody>
      </table>

      <div class="footer">
        Logic Gate Synthesizer — Design Analysis of Algorithms (DAA) Course Project
      </div>
    </body>
    </html>
  `;
}
