// --- FILE: public/script.js (CONTRACTOR VERSION - FINAL IFRAME PRINT) ---

console.log("Contractor script.js: File loading...");

// --- Hardcoded Style Lists ---
const doorStyles = [ "Shaker", "Slab", "Chamfer", "Savannah", "Beaded", "Stepped", "Ruth", "Maisie", "Mavis", "Dorothy", "Raised Panel", "Split Shaker", "Jean", "Nora", "Amelia", "Millie", "Glass", "Frances", "Alice", "Mabel", "Bessie", "Winona", "Eleanor", "Georgia" ].sort();
const drawerStyles = doorStyles.filter(style => !["Glass", "Georgia", "Split Shaker", "Winona", "Bessie", "Nora"].includes(style)).sort();

// --- Global variables ---
let globalTotalSqFt = 0;
let globalTotalDoors = 0;
let globalTotalDrawers = 0;

// --- DOM Element References ---
let sectionsContainer, addSectionBtn, calcForm, priceSetupContainer, togglePriceSetupBtn, clearAllBtn, resultsDiv, printBtnContainer, instructionsDiv, toggleInstructionsBtn, themeToggleBtn, printEstimateBtn;

// --- Theme Handling ---
const K_THEME = 'nuDoorsContractorTheme';
function applyTheme(theme) { if (theme === 'dark') { document.body.dataset.theme = 'dark'; if(themeToggleBtn) themeToggleBtn.textContent = '🌙'; localStorage.setItem(K_THEME, 'dark'); } else { document.body.removeAttribute('data-theme'); if(themeToggleBtn) themeToggleBtn.textContent = '☀️'; localStorage.setItem(K_THEME, 'light'); } console.log(`[Client Contractor] Theme applied: ${theme}`); }
function handleThemeToggle() { const currentTheme = document.body.dataset.theme; applyTheme(currentTheme === 'dark' ? 'light' : 'dark'); }
function loadInitialTheme() { const savedTheme = localStorage.getItem(K_THEME); const themeToApply = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); themeToggleBtn = themeToggleBtn || document.getElementById('themeToggleBtn'); applyTheme(themeToApply); }

/** Function to update global totals */
const updateTotals = function() { try { const sections = document.querySelectorAll('#sectionsContainer .section'); let totalSqFt = 0; sections.forEach(sec => { const height = parseFloat(sec.querySelector('input[name="sectionHeight"]')?.value) || 0; const width = parseFloat(sec.querySelector('input[name="sectionWidth"]')?.value) || 0; if (height > 0 && width > 0) { totalSqFt += (height * width) / 144; } }); globalTotalSqFt = totalSqFt; const doors0 = parseInt(document.querySelector('input[name="doors_0_36"]')?.value) || 0; const doors36 = parseInt(document.querySelector('input[name="doors_36_60"]')?.value) || 0; const doors60 = parseInt(document.querySelector('input[name="doors_60_82"]')?.value) || 0; globalTotalDoors = doors0 + doors36 + doors60; globalTotalDrawers = parseInt(document.querySelector('input[name="numDrawers"]')?.value) || 0; } catch (error) { console.error("Error in updateTotals:", error); } };

/** Creates a dynamic Rough Estimate section. */
function createRoughEstimateSection(index) {
    console.log(`[Client Contractor] Creating section ${index + 1}`);
    const sectionDiv = document.createElement('div'); sectionDiv.className = 'section'; sectionDiv.dataset.index = index;
    const doorOptions = doorStyles.map(s => `<option value="${s}">${escapeHTML(s)}</option>`).join('');
    const drawerOptions = drawerStyles.map(s => `<option value="${s}">${escapeHTML(s)}</option>`).join('');
    sectionDiv.innerHTML = `
      <div class="section-header">
         <span class="section-id">Section ${index + 1}</span>
         ${index > 0 ? '<button type="button" class="remove-button" title="Remove Section">×</button>' : ''}
      </div>
      <label> Door Style: <select name="sectionDoorStyle" required>${doorOptions}</select> </label>
      <label> Drawer Style: <select name="sectionDrawerStyle" required>${drawerOptions}</select> </label>
      <label> Finish:
        <select name="sectionFinish" required>
          <option value="Painted" selected>Painted</option><option value="Primed">Primed</option><option value="Unfinished">Unfinished</option>
        </select>
      </label>
      <div class="dimension-inputs">
        <label> Height (in): <input type="number" name="sectionHeight" value="12" min="0.1" step="0.01" required inputmode="decimal"/> </label>
        <label> Width (in): <input type="number" name="sectionWidth" value="12" min="0.1" step="0.01" required inputmode="decimal"/> </label>
      </div>`;
    const removeBtn = sectionDiv.querySelector('.remove-button');
    if (removeBtn) { removeBtn.addEventListener('click', () => { sectionDiv.remove(); updateSectionIndices(); updateTotals(); }); }
    sectionDiv.querySelectorAll('input, select').forEach(input => { input.addEventListener('change', updateTotals); if (input.type === 'number') { input.addEventListener('input', updateTotals); } });
    return sectionDiv;
}

/** Updates indices */
function updateSectionIndices() { const sections = document.querySelectorAll('#sectionsContainer .section'); sections.forEach((sec, idx) => { sec.dataset.index = idx; const sectionIdSpan = sec.querySelector('.section-id'); if (sectionIdSpan) sectionIdSpan.textContent = `Section ${idx + 1}`; let removeBtn = sec.querySelector('.remove-button'); if (idx === 0 && removeBtn) { removeBtn.remove(); } else if (idx > 0 && !removeBtn) { const header = sec.querySelector('.section-header'); if (header) { removeBtn = document.createElement('button'); removeBtn.type = 'button'; removeBtn.className = 'remove-button'; removeBtn.title = 'Remove Section'; removeBtn.innerHTML = '×'; removeBtn.addEventListener('click', () => { sec.remove(); updateSectionIndices(); updateTotals(); }); header.appendChild(removeBtn); } } }); }

/** Loads settings */
function loadPricingSettings() { const pricingFields = [ 'pricePerDoor', 'pricePerDrawer', 'refinishingCostPerSqFt', 'pricePerLazySusan', 'onSiteMeasuring', 'doorDisposalCost' ]; pricingFields.forEach(fieldName => { const input = document.querySelector(`#priceSetupContainer [name="${fieldName}"]`); if (input) { const savedValue = localStorage.getItem(`contractor_${fieldName}`); if (savedValue !== null) { input.value = savedValue; } else if (input.getAttribute('value')) { input.value = input.getAttribute('value'); } input.addEventListener('change', saveSetting); if (input.type === 'number') { input.addEventListener('input', saveSetting); } } else { console.warn(`Input field not found: ${fieldName}`); } }); const disposalSelect = document.querySelector('#specialFeatures select[name="calculateDisposal"]'); if (disposalSelect) { const savedDisposal = localStorage.getItem('contractor_calculateDisposal'); disposalSelect.value = savedDisposal || 'no'; disposalSelect.addEventListener('change', saveSetting); } else { console.warn("Disposal select not found."); } }

/** Saves setting */
function saveSetting(e) { if (e.target.name) { localStorage.setItem(`contractor_${e.target.name}`, e.target.value); console.log(`[Client Contractor] Saved setting: ${e.target.name} = ${e.target.value}`); } }

/** Format currency */
function formatCurrency(value) { const number = Number(value); if (isNaN(number)) return '$0.00'; return number.toLocaleString('en-US', { style: 'currency', currency: 'USD' }); }

/** Escape HTML */
function escapeHTML(str) { if (str === null || str === undefined) return ''; return String(str).replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, "").replace(/'/g, "'"); }

/** Display calculation results */
function displayResults(resultData) {
    console.log("[Client Contractor] Displaying results:", resultData);
    if (!resultData || typeof resultData !== 'object' || resultData.error) { const errorMsg = resultData?.error || 'Invalid or missing data received.'; resultsDiv.innerHTML = `<div class="invoice-error"><p><strong>Error processing results:</strong></p><p>${escapeHTML(errorMsg)}</p></div>`; if (printBtnContainer) printBtnContainer.style.display = 'none'; return; }
    const today = new Date(); const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const specialFeatures = resultData.specialFeatures || {}; const installation = resultData.installation || {}; const part2 = resultData.part2 || {}; const part3 = resultData.part3 || {}; const priceSetup = resultData.priceSetup || {};
    const overallTotal = formatCurrency(resultData.overallTotal); const allSectionsCost = formatCurrency(resultData.doorCostTotal); const hingeCost = formatCurrency(resultData.hingeCost); const refinishingCost = formatCurrency(resultData.refinishingCost); const measuringCost = formatCurrency(resultData.measuringCost); const disposalCostVal = resultData.disposalCost || 0; const disposalCost = formatCurrency(disposalCostVal); const customPaintCostVal = specialFeatures.customPaintCost || 0; const customPaintCost = formatCurrency(customPaintCostVal); const totalInstallCost = formatCurrency(installation.totalInstall); const lazySusanQty = part2.lazySusanQty ?? 0; const lazySusanSurcharge = formatCurrency(resultData.lazySusanSurcharge); const costToInstaller = formatCurrency(resultData.costToInstaller); const profitMargin = formatCurrency(resultData.profitMargin);
    const doors0_36 = part2.doors_0_36 ?? 0; const doors36_60 = part2.doors_36_60 ?? 0; const doors60_82 = part2.doors_60_82 ?? 0; const totalActualDoors = doors0_36 + doors36_60 + doors60_82; const totalDrawers = part2.numDrawers ?? 0;
    const hingeCount = resultData.hingeCount ?? 'N/A'; const doorsForDisposal = resultData.doorsForDisposal ?? 0; const drawersForDisposal = resultData.drawersForDisposal ?? 0; const lazySusansForDisposal = resultData.lazySusansForDisposal ?? 0; const calculateDisposalFlag = part3.calculateDisposal === 'yes';

    let html = `
      <div class="invoice">
        <div class="invoice-header">
           <img src="assets/logo.png" alt="nuDoors Logo" class="invoice-logo"> <h1>Project Estimate</h1> <p>Date: ${dateStr}</p> <p>Estimate ID: ${Date.now()}</p>
        </div>
        <h2>Summary of Charges</h2>
        <table class="summary-table"><tbody>
            <tr><td class="table-label" data-label="Door & Drawers">Door & Drawer Fronts (All Sections)</td><td class="table-value">${allSectionsCost}</td></tr>
            <tr><td class="table-label" data-label="Hinges">Hinge & Hardware Charge</td><td class="table-value">${hingeCost}</td></tr>
            ${customPaintCostVal > 0 ? `<tr><td class="table-label" data-label="Paint Fee">Custom Paint Fee</td><td class="table-value">${customPaintCost}</td></tr>` : ''}
            ${lazySusanQty > 0 ? `<tr><td class="table-label" data-label="LS Surcharge">Lazy Susan Surcharge</td><td class="table-value">${lazySusanSurcharge}</td></tr>` : ''}
            <tr><td class="table-label" data-label="Refinishing">Refinishing (${(resultData.priceSetup?.onSiteMeasuringSqFt || 0).toFixed(2)} sq ft @ ${formatCurrency(priceSetup.refinishingCostPerSqFt || 0)}/sqft)</td><td class="table-value">${refinishingCost}</td></tr>
            <tr><td class="table-label" data-label="Measuring">On-Site Measuring</td><td class="table-value">${measuringCost}</td></tr>
            <tr><td class="table-label" data-label="Installation">Installation (${totalActualDoors}D, ${totalDrawers}Dr, ${lazySusanQty}LS)</td><td class="table-value">${totalInstallCost}</td></tr>
            ${disposalCostVal > 0 ? `<tr><td class="table-label" data-label="Disposal">Disposal Fee</td><td class="table-value">${disposalCost}</td></tr>` : ''}
        </tbody><tfoot><tr class="total-row"><td class="table-label">Estimated Project Total</td><td class="table-value">${overallTotal}</td></tr></tfoot></table>
        <button type="button" id="toggleDetailsBtn" class="toggle-details-btn">Show Internal Details</button> <!-- Added class -->
        <div id="internalDetails" class="details-section" style="display: none;">
            <h3>Internal Cost & Count Breakdown</h3>
             <table class="details-table"><tbody>
                 <tr><td data-label="Doors 0-36"">Total Actual Doors (0-36"):</td><td data-label-value>${doors0_36}</td></tr>
                 <tr><td data-label="Doors 36-60"">Total Actual Doors (36-60"):</td><td data-label-value>${doors36_60}</td></tr>
                 <tr><td data-label="Doors 60-82"">Total Actual Doors (60-82"):</td><td data-label-value>${doors60_82}</td></tr>
                 <tr><td data-label="Drawers">Total Drawers:</td><td data-label-value>${totalDrawers}</td></tr>
                 <tr><td data-label="Lazy Susans">Number of Lazy Susans:</td><td data-label-value>${lazySusanQty}</td></tr>
                 <tr><td data-label="Hinges #">Total Hinge Count:</td><td data-label-value>${hingeCount}</td></tr>
                 <tr style="height: 1em;"><td colspan="2"></td></tr>
                 <tr><td data-label="Install Rate D">Installation Rate - Doors:</td><td data-label-value>${formatCurrency(priceSetup.pricePerDoor)} / door</td></tr>
                 <tr><td data-label="Install Rate Dr">Installation Rate - Drawers:</td><td data-label-value>${formatCurrency(priceSetup.pricePerDrawer)} / drawer</td></tr>
                 <tr><td data-label="Install Rate LS">Installation Rate - Lazy Susans:</td><td data-label-value>${formatCurrency(priceSetup.pricePerLazySusan)} / LS</td></tr>
                 <tr><td data-label="Install Sub D">Installation Subtotal - Doors:</td><td data-label-value>${formatCurrency(installation.doorInstall)}</td></tr>
                 <tr><td data-label="Install Sub Dr">Installation Subtotal - Drawers:</td><td data-label-value>${formatCurrency(installation.drawerInstall)}</td></tr>
                 <tr><td data-label="Install Sub LS">Installation Subtotal - Lazy Susans:</td><td data-label-value>${formatCurrency(installation.lazySusanInstall)}</td></tr>
                 <tr style="height: 1em;"><td colspan="2"></td></tr>
                 ${calculateDisposalFlag ? `
                     <tr><td data-label="Disposal Rate">Disposal Rate:</td><td data-label-value>${formatCurrency(priceSetup.doorDisposalCost)} / unit</td></tr>
                     <tr><td data-label="Disposal D">Units (Doors):</td><td data-label-value>${doorsForDisposal}</td></tr>
                     <tr><td data-label="Disposal Dr">Units (Drawers):</td><td data-label-value>${drawersForDisposal}</td></tr>
                     <tr><td data-label="Disposal LS">Units (Lazy Susans x2):</td><td data-label-value>${lazySusansForDisposal * 2}</td></tr>
                     <tr><td data-label="Disposal Cost">Calculated Disposal Cost:</td><td data-label-value>${disposalCost}</td></tr>
                 ` : `<tr><td colspan="2">Disposal Cost Not Included</td></tr>`}
                 <tr style="height: 1em;"><td colspan="2"></td></tr>
                 <tr><td data-label="Cost Basis">Cost To Installer (Sections + Hinges):</td><td data-label-value>${costToInstaller}</td></tr>
                 <tr><td data-label="Profit">Profit Margin:</td><td data-label-value>${profitMargin}</td></tr>
             </tbody></table>
        </div>
        <p class="estimate-footer">Thank you for choosing nuDoors! This estimate is valid for 30 days.</p>
      </div>`;
    resultsDiv.innerHTML = html;
    const toggleBtn = document.getElementById('toggleDetailsBtn'); const detailsDiv = document.getElementById('internalDetails');
    if (toggleBtn && detailsDiv) { detailsDiv.style.display = 'none'; toggleBtn.textContent = 'Show Internal Details'; detailsDiv.classList.remove('print-section'); toggleBtn.addEventListener('click', () => { const isHidden = detailsDiv.style.display === 'none'; detailsDiv.style.display = isHidden ? 'block' : 'none'; toggleBtn.textContent = isHidden ? 'Hide Internal Details' : 'Show Internal Details'; detailsDiv.classList.toggle('print-section', !isHidden); }); console.log("[Client Contractor] Toggle Details listener attached."); }
    else { console.error("[Client Contractor] Toggle Details button or div not found."); }
    if(printBtnContainer) printBtnContainer.style.display = 'block';
}

/** Handles printing using an iframe */
function handlePrintRequest() {
    console.log('[Client Contractor] Print button clicked. Using iframe method...');
    const invoiceElement = document.querySelector('#results .invoice'); // Target the specific invoice div

    if (!invoiceElement) {
        console.error("Cannot print: Invoice element not found.");
        alert("Error: Could not find estimate content to print.");
        return;
    }

    // Check if internal details should be printed BEFORE creating iframe
    const internalDetailsDiv = document.getElementById('internalDetails');
    const includeInternalDetails = internalDetailsDiv && internalDetailsDiv.classList.contains('print-section');
    console.log("[Client Contractor] Include internal details in print:", includeInternalDetails);


    // Create a hidden iframe
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute'; printFrame.style.width = '0';
    printFrame.style.height = '0'; printFrame.style.border = '0';
    printFrame.style.visibility = 'hidden'; printFrame.setAttribute('aria-hidden', 'true');
    document.body.appendChild(printFrame);

    try {
        const frameDoc = printFrame.contentWindow.document;
        frameDoc.open();
        // --- Embed Print Styles Directly ---
        frameDoc.write(`<!DOCTYPE html>
        <html>
        <head>
            <title>Print Estimate - nuDoors Contractor</title>
            <style>
                /* --- EMBEDDED PRINT STYLES --- */
                 @media print {
                    /* Basic page setup */
                    @page { size: A4; margin: 1cm; }
                    body { background: white !important; color: black !important; margin: 0 !important; padding: 0 !important; font-family: Arial, sans-serif !important; font-size: 10pt !important; line-height: 1.3; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; height: auto !important; width: auto !important; overflow: visible !important; }

                    /* --- Hide ALL non-invoice elements explicitly --- */
                    /* Includes elements specific to contractor version */
                    header, #toggleInstructionsContainer, #instructions, #exampleImage,
                    #calcForm > *:not(#results), #roughEstimateContainer, #mainConfigRow,
                    #priceSetupContainer, #otherPartsContainer, #formActions, #printButtonContainer,
                    #themeToggleBtn, small, button, input, select, #togglePriceSetupBtn,
                    #toggleInstructionsBtn, .toggle-details-btn /* Hide toggle btn itself */
                     {
                        display: none !important;
                        visibility: hidden !important;
                    }
                    /* Ensure Results container IS visible */
                    #results { display: block !important; visibility: visible !important; margin: 0 !important; padding: 0 !important; border: none !important; width: 100% !important; overflow: visible !important; position: static !important; }
                    /* Invoice container styling - Plain look */
                    .invoice { visibility: visible !important; display: block !important; width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; border: none !important; box-shadow: none !important; background: white !important; color: black !important; border-radius: 0 !important; font-size: 10pt !important; position: static !important; overflow: visible !important; }
                    .invoice > * { visibility: visible !important; color: black !important; background: none !important; }
                    /* Invoice Header */
                    .invoice-header { text-align: center; border-bottom: 2px solid black !important; padding-bottom: 0.8em !important; margin-bottom: 1.5em !important; }
                    .invoice-header img.invoice-logo { display: block !important; max-height: 60px; margin: 0 auto 0.5em auto; filter: grayscale(100%); }
                    .invoice-header h1 { font-size: 16pt !important; font-weight: bold !important; margin-bottom: 0.1em !important; }
                    .invoice-header p { font-size: 9pt !important; margin: 0.2em 0 !important; }
                    /* Section Titles */
                    .invoice h2, .invoice h3 { font-size: 12pt !important; font-weight: bold !important; margin-top: 1.2em !important; margin-bottom: 0.6em !important; border-bottom: 1px solid #666 !important; padding-bottom: 0.2em !important; text-align: left !important; page-break-after: avoid !important; }
                    .invoice h2:first-of-type, .invoice h3:first-of-type { margin-top: 0 !important; }

                    /* --- PRINT TABLE CELL & PSEUDO-ELEMENT RESET --- */
                    .invoice table td,
                    .invoice table th { display: table-cell !important; visibility: visible !important; border: 1px solid #ccc !important; padding: 5px 8px !important; text-align: left !important; vertical-align: top !important; color: black !important; background: white !important; box-shadow: none !important; word-wrap: break-word; position: static !important; }
                    .invoice table td::before, .invoice table th::before { content: none !important; display: none !important; padding: 0 !important; margin: 0 !important; position: static !important; width: auto !important; left: auto !important; }

                    /* --- Print Table Layout & Alignment --- */
                    .invoice table { display: table !important; width: 100% !important; border-collapse: collapse !important; margin-bottom: 1.5em !important; font-size: 9pt !important; border-spacing: 0 !important; page-break-inside: auto; table-layout: auto !important; } /* Using auto layout */
                    .invoice table thead { display: table-header-group !important; }
                    .invoice table tbody { display: table-row-group !important; }
                    .invoice table tr { display: table-row !important; page-break-inside: avoid !important; }
                    .invoice thead th { background-color: #eee !important; font-weight: bold !important; border-bottom: 1px solid #999 !important; }

                    /* Align specific columns */
                     .invoice .details-table td:first-child { text-align: left !important;} /* Label left */
                     .invoice .details-table td:last-child { text-align: right !important;} /* Value right */
                     .invoice .summary-table .table-label { text-align: left !important; font-weight: normal !important; width: 70%; border-right: none !important; }
                     .invoice .summary-table .table-value { text-align: right !important; font-weight: normal !important; border-left: none !important; }

                    /* Totals Row */
                    .invoice tfoot { border-top: none !important; display: table-footer-group !important;}
                    .invoice .summary-table tfoot tr { page-break-inside: avoid !important; display: table-row !important; }
                    .invoice .total-row { background-color: white !important; border-top: 2px solid black !important; }
                    .invoice .total-row td { font-weight: bold !important; font-size: 11pt !important; border: none !important; border-top: 2px solid black !important; padding: 6px 8px !important; color: black !important; display: table-cell !important; }
                    .invoice .total-row .table-label { text-align: right !important; width: auto !important; padding-right: 1em; }
                    .invoice .total-row .table-value { text-align: right !important; }

                    /* Footer */
                    .estimate-footer { text-align: center !important; margin-top: 2em !important; padding-top: 1em !important; border-top: 1px solid #ccc !important; font-size: 8pt !important; color: #333 !important; page-break-before: auto; }

                    /* --- Internal Details Printing --- REVISED --- */
                    #internalDetails { /* Default hide */
                         display: none !important; visibility: hidden !important;
                         height: 0 !important; overflow: hidden !important;
                         margin: 0 !important; padding: 0 !important; border: none !important;
                    }
                    #internalDetails.print-section { /* Styles ONLY when class is present */
                         display: block !important; visibility: visible !important;
                         height: auto !important; overflow: visible !important;
                         margin-top: 1.5em !important; padding: 1em !important;
                         border: 1px solid #ccc !important; page-break-before: auto;
                         background: #f8f8f8 !important; color: black !important;
                    }
                    #internalDetails.print-section * { /* Ensure children are visible */
                        visibility: visible !important; color: black !important; background: none !important;
                    }
                    #internalDetails.print-section h3 {
                        font-size: 11pt !important; margin-bottom: 0.5em !important;
                        border-bottom: 1px solid #666 !important; padding-bottom: 0.2em !important;
                        text-align: left !important; page-break-after: avoid !important;
                    }
                    #internalDetails.print-section table {
                         font-size: 9pt !important; margin-bottom: 0.5em !important;
                         table-layout: auto !important; display: table !important;
                         width: 100% !important; border-collapse: collapse !important;
                         border-spacing: 0 !important; page-break-inside: auto;
                    }
                     #internalDetails.print-section table tbody { display: table-row-group !important; }
                     #internalDetails.print-section table tr { display: table-row !important; page-break-inside: avoid !important;}
                     #internalDetails.print-section table td {
                         border: 1px solid #ddd !important; padding: 4px 6px !important;
                         background: white !important; display: table-cell !important;
                         visibility: visible !important; color: black !important;
                         text-align: left !important; vertical-align: top !important;
                         position: static !important;
                    }
                     #internalDetails.print-section table td::before { content: none !important; display: none !important; }
                     #internalDetails.print-section td:first-child { text-align: left !important; width: 70%; } /* Label column */
                     #internalDetails.print-section td:last-child { text-align: right !important; width: 30%;} /* Value column */

                    /* Ensure errors/loading are not printed */
                    .invoice-error, .invoice-loading { display: none !important; }
                }

                /* Minimal Base Styles for Iframe Rendering */
                body { font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.3; color: black; margin: 0; padding: 0;}
                h1, h2, h3 { margin: 1em 0 0.5em 0; padding: 0; }
                p { margin: 0 0 0.5em 0; padding: 0; }
                table { border-collapse: collapse; width: 100%; margin-bottom: 1em; font-size: 9pt;}
                th, td { border: 1px solid #ccc; padding: 5px 8px; text-align: left; vertical-align: top; }
                th { background-color: #eee; font-weight: bold; }
                tfoot { font-weight: bold; }
                .total-row td { border-top: 2px solid black; font-size: 11pt; }
                .invoice { margin: 0; padding: 0; }
                .details-section { margin-top: 1.5em; padding: 1em; border: 1px solid #ccc; background: #f8f8f8; }
                .details-section h3 { font-size: 11pt; margin-bottom: 0.5em; }
                .details-section table td { border: 1px solid #ddd; padding: 4px 6px; }
                .details-section td:last-child { text-align: right; }

            </style>
        </head>
        <body>
            <!-- Inject the invoice HTML including the current classes (like print-section) -->
            ${invoiceElement.outerHTML}
        </body>
        </html>`);
        frameDoc.close();

        setTimeout(() => {
            try {
                printFrame.contentWindow.focus();
                printFrame.contentWindow.print();
                console.log('[Client Contractor] iframe print command issued.');
            } catch(printError) {
                 console.error('[Client Contractor] Error calling print on iframe:', printError);
                  alert("An error occurred trying to print.");
            } finally {
                 setTimeout(() => { // Delay removal
                     if (printFrame.parentNode) { document.body.removeChild(printFrame); console.log('[Client Contractor] iframe removed.'); }
                 }, 500);
            }
        }, 250); // Delay before calling print

    } catch (error) {
        console.error('[Client Contractor] Error creating print iframe:', error);
        alert("An error occurred preparing the print view.");
        if (printFrame && printFrame.parentNode) { document.body.removeChild(printFrame); }
    }
}

/** Set up wizard navigation and general button listeners */
function initializeWizard() {
    console.log("[Client Contractor] Initializing wizard UI listeners...");
    printEstimateBtn = document.getElementById('printEstimate'); // Assign here

    themeToggleBtn.addEventListener('click', handleThemeToggle);
    togglePriceSetupBtn.addEventListener('click', () => { const isCollapsed = priceSetupContainer.classList.toggle('collapsed'); togglePriceSetupBtn.textContent = isCollapsed ? 'Show' : 'Hide'; });
    toggleInstructionsBtn.addEventListener('click', () => { const isHidden = instructionsDiv.style.display === 'none'; instructionsDiv.style.display = isHidden ? 'block' : 'none'; toggleInstructionsBtn.textContent = isHidden ? 'Hide Directions' : 'Show Directions'; });
    addSectionBtn.addEventListener('click', () => { const index = sectionsContainer.children.length; sectionsContainer.appendChild(createRoughEstimateSection(index)); updateTotals(); });
    clearAllBtn.addEventListener('click', () => { console.log("[Client Contractor] Clear All clicked."); document.querySelectorAll('#roughEstimateContainer input, #roughEstimateContainer select, #otherPartsContainer input, #otherPartsContainer select').forEach(el => { if (el.closest('#priceSetupContainer')) return; if (el.type === 'number') el.value = el.getAttribute('value') || '0'; else if (el.type === 'text') el.value = ''; else if (el.tagName === 'SELECT') { if(el.name === 'calculateDisposal') { el.value = 'no'; } else { el.selectedIndex = 0; } } }); sectionsContainer.innerHTML = ''; for (let i = 0; i < 2; i++) { sectionsContainer.appendChild(createRoughEstimateSection(i)); } updateSectionIndices(); loadPricingSettings(); priceSetupContainer.classList.remove('collapsed'); togglePriceSetupBtn.textContent = 'Hide'; if (instructionsDiv) instructionsDiv.style.display = 'none'; toggleInstructionsBtn.textContent = 'Show Directions'; resultsDiv.innerHTML = ''; if (printBtnContainer) printBtnContainer.style.display = 'none'; updateTotals(); console.log("[Client Contractor] Clear All finished."); });
    calcForm.addEventListener('submit', handleCalculate); // Changed to reference separate function

    // --- Attach IFRAME Print Handler ---
    if (printEstimateBtn) {
        printEstimateBtn.addEventListener('click', handlePrintRequest); // Attach iframe handler
    } else {
        console.warn("[Client Contractor] Print Estimate button (#printEstimate) not found.");
    }

    console.log("[Client Contractor] Event listeners attached.");
} // <--- End of initializeWizard

/** Initial setup when DOM is ready */
function main() {
    console.log("[Client Contractor] DOMContentLoaded event fired.");
    // --- Assign Global DOM References ---
    sectionsContainer = document.getElementById('sectionsContainer'); addSectionBtn = document.getElementById('addSectionBtn'); calcForm = document.getElementById('calcForm'); priceSetupContainer = document.getElementById('priceSetupContainer'); togglePriceSetupBtn = document.getElementById('togglePriceSetupBtn'); clearAllBtn = document.getElementById('clearAllBtn'); resultsDiv = document.getElementById('results'); printBtnContainer = document.getElementById('printButtonContainer'); instructionsDiv = document.getElementById('instructions'); toggleInstructionsBtn = document.getElementById('toggleInstructionsBtn'); themeToggleBtn = document.getElementById('themeToggleBtn');
    // printEstimateBtn is assigned and checked within initializeWizard

    // --- Check Essential Elements ---
    const criticalElements = [ sectionsContainer, addSectionBtn, calcForm, priceSetupContainer, togglePriceSetupBtn, clearAllBtn, resultsDiv, printBtnContainer, instructionsDiv, toggleInstructionsBtn, themeToggleBtn ];
    if (criticalElements.some(el => !el)) { console.error("CRITICAL ERROR: One or more essential HTML elements not found."); /* ... logging ... */ document.body.innerHTML = '<h1 style="color: red;">Error: UI failed to initialize.</h1>'; return; }
    console.log("[Client Contractor] Essential elements references obtained.");

    loadInitialTheme();
    try { console.log("[Client Contractor] Loading settings..."); loadPricingSettings(); console.log("[Client Contractor] Settings loaded."); } catch (error) { console.error("Error during loadPricingSettings:", error); }

    // --- Initialize Sections (start with 2) ---
    sectionsContainer.innerHTML = '';
    for (let i = 0; i < 2; i++) { sectionsContainer.appendChild(createRoughEstimateSection(i)); }
    updateSectionIndices(); updateTotals();

    initializeWizard(); // Initialize listeners AFTER elements exist

    console.log("[Client Contractor] DOMContentLoaded setup complete.");
} // End of main

// --- Run the main setup function ---
document.addEventListener('DOMContentLoaded', main);

console.log("Contractor script.js: File finished parsing.");