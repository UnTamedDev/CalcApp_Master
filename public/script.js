// --- FILE: public/script.js (CONTRACTOR VERSION - EMAIL FORMATTING & SCROLL ADDED) ---

console.log("Contractor script.js: File loading...");

// --- Hardcoded Style Lists ---
const doorStyles = [ "Shaker", "Slab", "Chamfer", "Savannah", "Beaded", "Stepped", "Ruth", "Maisie", "Mavis", "Dorothy", "Raised Panel", "Split Shaker", "Jean", "Nora", "Amelia", "Millie", "Glass", "Frances", "Alice", "Mabel", "Bessie", "Winona", "Eleanor", "Georgia" ].sort();
const drawerStyles = doorStyles.filter(style => !["Glass", "Georgia", "Split Shaker", "Winona", "Bessie", "Nora"].includes(style)).sort();

// --- Global variables ---
let globalTotalSqFt = 0;
let globalTotalDoors = 0;
let globalTotalDrawers = 0;
let lastCalculationResult = null; // Store last result for email

// --- DOM Element References ---
let sectionsContainer, addSectionBtn, calcForm, priceSetupContainer, togglePriceSetupBtn, clearAllBtn, resultsDiv, printBtnContainer, instructionsDiv, toggleInstructionsBtn, themeToggleBtn, printEstimateBtn,
    outputActionsContainer, emailEstimateContainer, clientEmailInput, sendEmailBtn, emailStatusDiv;


// --- Theme Handling ---
const K_THEME = 'nuDoorsContractorTheme';
function applyTheme(theme) { if (theme === 'dark') { document.body.dataset.theme = 'dark'; if(themeToggleBtn) themeToggleBtn.textContent = '🌙'; localStorage.setItem(K_THEME, 'dark'); } else { document.body.removeAttribute('data-theme'); if(themeToggleBtn) themeToggleBtn.textContent = '☀️'; localStorage.setItem(K_THEME, 'light'); } console.log(`[Client Contractor] Theme applied: ${theme}`); }
function handleThemeToggle() { const currentTheme = document.body.dataset.theme; applyTheme(currentTheme === 'dark' ? 'light' : 'dark'); }
function loadInitialTheme() { const savedTheme = localStorage.getItem(K_THEME); const themeToApply = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); themeToggleBtn = themeToggleBtn || document.getElementById('themeToggleBtn'); applyTheme(themeToApply); }

/** Function to update global totals */
const updateTotals = function() { try { const sections = document.querySelectorAll('#sectionsContainer .section'); let totalSqFt = 0; sections.forEach(sec => { const height = parseFloat(sec.querySelector('input[name="sectionHeight"]')?.value) || 0; const width = parseFloat(sec.querySelector('input[name="sectionWidth"]')?.value) || 0; if (height > 0 && width > 0) { totalSqFt += (height * width) / 144; } }); globalTotalSqFt = totalSqFt; const doors0 = parseInt(calcForm.querySelector('input[name="doors_0_36"]')?.value) || 0; const doors36 = parseInt(calcForm.querySelector('input[name="doors_36_60"]')?.value) || 0; const doors60 = parseInt(calcForm.querySelector('input[name="doors_60_82"]')?.value) || 0; globalTotalDoors = doors0 + doors36 + doors60; globalTotalDrawers = parseInt(calcForm.querySelector('input[name="numDrawers"]')?.value) || 0; } catch (error) { console.error("Error in updateTotals:", error); } };

/** Creates a dynamic Rough Estimate section. */
function createRoughEstimateSection(index) { console.log(`[Client Contractor] Creating section ${index + 1}`); const sectionDiv = document.createElement('div'); sectionDiv.className = 'section'; sectionDiv.dataset.index = index; const doorOptions = doorStyles.map(s => `<option value="${s}">${escapeHTML(s)}</option>`).join(''); const drawerOptions = drawerStyles.map(s => `<option value="${s}">${escapeHTML(s)}</option>`).join(''); sectionDiv.innerHTML = ` <div class="section-header"> <span class="section-id">Section ${index + 1}</span> ${index > 0 ? '<button type="button" class="remove-button" title="Remove Section">×</button>' : ''} </div> <label> Door Style: <select name="sectionDoorStyle" required>${doorOptions}</select> </label> <label> Drawer Style: <select name="sectionDrawerStyle" required>${drawerOptions}</select> </label> <label> Finish: <select name="sectionFinish" required> <option value="Painted" selected>Painted</option><option value="Primed">Primed</option><option value="Unfinished">Unfinished</option> </select> </label> <div class="dimension-inputs"> <label> Height (in): <input type="number" name="sectionHeight" value="12" min="0.1" step="0.01" required inputmode="decimal"/> </label> <label> Width (in): <input type="number" name="sectionWidth" value="12" min="0.1" step="0.01" required inputmode="decimal"/> </label> </div>`; const removeBtn = sectionDiv.querySelector('.remove-button'); if (removeBtn) { removeBtn.addEventListener('click', () => { sectionDiv.remove(); updateSectionIndices(); updateTotals(); }); } sectionDiv.querySelectorAll('input, select').forEach(input => { input.addEventListener('change', updateTotals); if (input.type === 'number') { input.addEventListener('input', updateTotals); } }); return sectionDiv; }

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

/** Generates simpler HTML for email */
function generateEmailHtml(resultData) {
    console.log("[Client Contractor] Generating Email HTML");
    if (!resultData || typeof resultData !== 'object') return '<p>Error generating estimate content.</p>';

    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const specialFeatures = resultData.specialFeatures || {}; const installation = resultData.installation || {};
    const part2 = resultData.part2 || {}; const priceSetup = resultData.priceSetup || {};

    const overallTotal = formatCurrency(resultData.overallTotal); const allSectionsCost = formatCurrency(resultData.doorCostTotal);
    const hingeCost = formatCurrency(resultData.hingeCost); const refinishingCost = formatCurrency(resultData.refinishingCost);
    const measuringCost = formatCurrency(resultData.measuringCost); const disposalCostVal = resultData.disposalCost || 0;
    const disposalCost = formatCurrency(disposalCostVal); const customPaintCostVal = specialFeatures.customPaintCost || 0;
    const customPaintCost = formatCurrency(customPaintCostVal); const totalInstallCost = formatCurrency(installation.totalInstall);
    const lazySusanQty = part2.lazySusanQty ?? 0; const lazySusanSurcharge = formatCurrency(resultData.lazySusanSurcharge);
    const doors0_36 = part2.doors_0_36 ?? 0; const doors36_60 = part2.doors_36_60 ?? 0; const doors60_82 = part2.doors_60_82 ?? 0;
    const totalActualDoors = doors0_36 + doors36_60 + doors60_82; const totalDrawers = part2.numDrawers ?? 0;

     // Basic inline styles for email client compatibility
     const tableStyle = "width: 100%; border-collapse: collapse; margin-bottom: 15px; font-family: Arial, sans-serif; font-size: 10pt;";
     const thStyle = "border: 1px solid #cccccc; padding: 8px; text-align: left; background-color: #eeeeee; font-weight: bold;";
     const tdStyle = "border: 1px solid #cccccc; padding: 8px; text-align: left;";
     const tdRightStyle = "border: 1px solid #cccccc; padding: 8px; text-align: right;";
     const tdTotalLabelStyle = "border: none; border-top: 2px solid black; padding: 8px; text-align: right; font-weight: bold;";
     const tdTotalValueStyle = "border: none; border-top: 2px solid black; padding: 8px; text-align: right; font-weight: bold; font-size: 11pt;";
     const h2Style = "font-family: Arial, sans-serif; color: #333333; margin-top: 20px; margin-bottom: 10px; text-align: center; font-size: 14pt;";
     const pStyle = "font-family: Arial, sans-serif; color: #555555; font-size: 10pt; margin: 5px 0;";
     const footerStyle = "font-family: Arial, sans-serif; color: #777777; font-size: 9pt; margin-top: 20px; text-align: center; border-top: 1px solid #dddddd; padding-top: 10px;";

    let emailHtml = `
        <div style="width: 100%; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
            <h1 style="text-align: center; color: #26c6da; font-family: Arial, sans-serif;">nuDoors Project Estimate</h1>
            <p style="${pStyle} text-align: center;">Date: ${dateStr}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 15px 0;">

            <h2 style="${h2Style}">Summary of Charges</h2>
            <table style="${tableStyle}">
              <tbody>
                <tr><td style="${tdStyle}">Door & Drawer Fronts</td><td style="${tdRightStyle}">${allSectionsCost}</td></tr>
                <tr><td style="${tdStyle}">Hinge & Hardware Charge</td><td style="${tdRightStyle}">${hingeCost}</td></tr>
                ${customPaintCostVal > 0 ? `<tr><td style="${tdStyle}">Custom Paint Fee</td><td style="${tdRightStyle}">${customPaintCost}</td></tr>` : ''}
                ${lazySusanQty > 0 ? `<tr><td style="${tdStyle}">Lazy Susan Surcharge</td><td style="${tdRightStyle}">${lazySusanSurcharge}</td></tr>` : ''}
                <tr><td style="${tdStyle}">Refinishing (${(resultData.priceSetup?.onSiteMeasuringSqFt || 0).toFixed(2)} sq ft)</td><td style="${tdRightStyle}">${refinishingCost}</td></tr>
                <tr><td style="${tdStyle}">On-Site Measuring</td><td style="${tdRightStyle}">${measuringCost}</td></tr>
                <tr><td style="${tdStyle}">Installation (${totalActualDoors}D, ${totalDrawers}Dr, ${lazySusanQty}LS)</td><td style="${tdRightStyle}">${totalInstallCost}</td></tr>
                ${disposalCostVal > 0 ? `<tr><td style="${tdStyle}">Disposal Fee</td><td style="${tdRightStyle}">${disposalCost}</td></tr>` : ''}
              </tbody>
              <tfoot>
                <tr><td style="${tdTotalLabelStyle}">Estimated Project Total</td><td style="${tdTotalValueStyle}">${overallTotal}</td></tr>
              </tfoot>
            </table>
            <p style="${footerStyle}">This estimate is valid for 30 days. Tax not included.</p>
        </div>
    `;
    return emailHtml;
}

/** Display calculation results */
function displayResults(resultData) {
    console.log("[Client Contractor] Displaying results:", resultData);
    if (!resultData || typeof resultData !== 'object' || resultData.error) { const errorMsg = resultData?.error || 'Invalid or missing data received.'; resultsDiv.innerHTML = `<div class="invoice-error"><p><strong>Error:</strong></p><p>${escapeHTML(errorMsg)}</p></div>`; if (outputActionsContainer) outputActionsContainer.style.display = 'none'; return; }

    // Store result for email sending
    lastCalculationResult = resultData;

    const today = new Date(); const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const specialFeatures = resultData.specialFeatures || {}; const installation = resultData.installation || {}; const part2 = resultData.part2 || {}; const part3 = resultData.part3 || {}; const priceSetup = resultData.priceSetup || {};
    const overallTotal = formatCurrency(resultData.overallTotal); const allSectionsCost = formatCurrency(resultData.doorCostTotal); const hingeCost = formatCurrency(resultData.hingeCost); const refinishingCost = formatCurrency(resultData.refinishingCost); const measuringCost = formatCurrency(resultData.measuringCost); const disposalCostVal = resultData.disposalCost || 0; const disposalCost = formatCurrency(disposalCostVal); const customPaintCostVal = specialFeatures.customPaintCost || 0; const customPaintCost = formatCurrency(customPaintCostVal); const totalInstallCost = formatCurrency(installation.totalInstall); const lazySusanQty = part2.lazySusanQty ?? 0; const lazySusanSurcharge = formatCurrency(resultData.lazySusanSurcharge); const costToInstaller = formatCurrency(resultData.costToInstaller); const profitMargin = formatCurrency(resultData.profitMargin);
    const doors0_36 = part2.doors_0_36 ?? 0; const doors36_60 = part2.doors_36_60 ?? 0; const doors60_82 = part2.doors_60_82 ?? 0; const totalActualDoors = doors0_36 + doors36_60 + doors60_82; const totalDrawers = part2.numDrawers ?? 0;
    const hingeCount = resultData.hingeCount ?? 'N/A'; const doorsForDisposal = resultData.doorsForDisposal ?? 0; const drawersForDisposal = resultData.drawersForDisposal ?? 0; const lazySusansForDisposal = resultData.lazySusansForDisposal ?? 0; const calculateDisposalFlag = part3.calculateDisposal === 'yes';

    let html = `
      <div class="invoice">
        <div class="invoice-header"><img src="assets/logo.png" alt="nuDoors Logo" class="invoice-logo"> <h1>Project Estimate</h1> <p>Date: ${dateStr}</p> <p>Estimate ID: ${Date.now()}</p></div>
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
        <button type="button" id="toggleDetailsBtn" class="toggle-details-btn">Show Internal Details</button>
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
                 <tr><td data-label="Install Rate D">Rate - Doors:</td><td data-label-value>${formatCurrency(priceSetup.pricePerDoor)} / door</td></tr>
                 <tr><td data-label="Install Rate Dr">Rate - Drawers:</td><td data-label-value>${formatCurrency(priceSetup.pricePerDrawer)} / drawer</td></tr>
                 <tr><td data-label="Install Rate LS">Rate - Lazy Susans:</td><td data-label-value>${formatCurrency(priceSetup.pricePerLazySusan)} / LS</td></tr>
                 <tr><td data-label="Install Sub D">Subtotal - Doors:</td><td data-label-value>${formatCurrency(installation.doorInstall)}</td></tr>
                 <tr><td data-label="Install Sub Dr">Subtotal - Drawers:</td><td data-label-value>${formatCurrency(installation.drawerInstall)}</td></tr>
                 <tr><td data-label="Install Sub LS">Subtotal - Lazy Susans:</td><td data-label-value>${formatCurrency(installation.lazySusanInstall)}</td></tr>
                 <tr style="height: 1em;"><td colspan="2"></td></tr>
                 ${calculateDisposalFlag ? `<tr><td data-label="Disposal Rate">Disposal Rate:</td><td data-label-value>${formatCurrency(priceSetup.doorDisposalCost)} / unit</td></tr><tr><td data-label="Disposal D">Units (Doors):</td><td data-label-value>${doorsForDisposal}</td></tr><tr><td data-label="Disposal Dr">Units (Drawers):</td><td data-label-value>${drawersForDisposal}</td></tr><tr><td data-label="Disposal LS">Units (Lazy Susans x2):</td><td data-label-value>${lazySusansForDisposal * 2}</td></tr><tr><td data-label="Disposal Cost">Calculated Disposal Cost:</td><td data-label-value>${disposalCost}</td></tr>` : `<tr><td colspan="2">Disposal Not Included</td></tr>`}
                 <tr style="height: 1em;"><td colspan="2"></td></tr>
                 <tr><td data-label="Cost Basis">Cost To Installer:</td><td data-label-value>${costToInstaller}</td></tr>
                 <tr><td data-label="Profit">Profit Margin:</td><td data-label-value>${profitMargin}</td></tr>
             </tbody></table>
        </div>
        <p class="estimate-footer">Estimate valid for 30 days.</p>
      </div>`;

    resultsDiv.innerHTML = html;
    const toggleBtn = resultsDiv.querySelector('#toggleDetailsBtn'); const detailsDiv = resultsDiv.querySelector('#internalDetails');
    if (toggleBtn && detailsDiv) { detailsDiv.style.display = 'none'; toggleBtn.textContent = 'Show Internal Details'; detailsDiv.classList.remove('print-section'); const toggleDetailsHandler = () => { const isHidden = detailsDiv.style.display === 'none'; detailsDiv.style.display = isHidden ? 'block' : 'none'; toggleBtn.textContent = isHidden ? 'Hide Internal Details' : 'Show Internal Details'; detailsDiv.classList.toggle('print-section', !isHidden); }; toggleBtn.addEventListener('click', toggleDetailsHandler); console.log("[Client Ctr] Toggle Details listener attached."); }
    else { console.error("[Client Ctr] Toggle Details elements not found after results."); }

    outputActionsContainer = outputActionsContainer || document.getElementById('outputActionsContainer');
    if (outputActionsContainer) outputActionsContainer.style.display = 'block'; // Show Email/Print section
    emailStatusDiv = emailStatusDiv || document.getElementById('emailStatus'); if(emailStatusDiv) { emailStatusDiv.textContent = ''; emailStatusDiv.className = ''; }
    clientEmailInput = clientEmailInput || document.getElementById('clientEmailInput'); if(clientEmailInput) clientEmailInput.value = '';

    setTimeout(() => { resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' }); console.log("[Client Ctr] Scrolled to results."); }, 100);
}

/** Handle calculation */
async function handleCalculate(e) {
    if (e) e.preventDefault(); console.log("[Client Ctr] handleCalculate started.");
    resultsDiv.innerHTML = '<div class="invoice-loading"><p>Calculating...</p></div>';
    outputActionsContainer = outputActionsContainer || document.getElementById('outputActionsContainer'); if(outputActionsContainer) outputActionsContainer.style.display = 'none'; // Hide actions
    try {
        updateTotals(); console.log("[Client Ctr] Totals updated.");
        const sections = []; let hasInvalidSection = false;
        document.querySelectorAll('#sectionsContainer .section').forEach(sec => { const heightInput = sec.querySelector('input[name="sectionHeight"]'); const widthInput = sec.querySelector('input[name="sectionWidth"]'); const height = parseFloat(heightInput?.value) || 0; const width = parseFloat(widthInput?.value) || 0; if(heightInput) heightInput.style.border = ''; if(widthInput) widthInput.style.border = ''; if (height <= 0 || width <= 0) { console.warn(`Skipping section ${parseInt(sec.dataset.index) + 1}.`); if(heightInput) heightInput.style.border = '1px solid red'; if(widthInput) widthInput.style.border = '1px solid red'; hasInvalidSection = true; return; } sections.push({ doorStyle: sec.querySelector('select[name="sectionDoorStyle"]')?.value || '', drawerStyle: sec.querySelector('select[name="sectionDrawerStyle"]')?.value || '', finish: sec.querySelector('select[name="sectionFinish"]')?.value || '', height: height, width: width }); });
        if (hasInvalidSection) { throw new Error("Some sections have invalid dimensions (Height and Width must be > 0)."); } if (sections.length === 0 && document.querySelectorAll('#sectionsContainer .section').length > 0) { throw new Error("All sections have invalid dimensions."); } else if (sections.length === 0 && document.querySelectorAll('#sectionsContainer .section').length === 0) { throw new Error("Please add at least one section."); }
        const formData = new FormData(calcForm);
        const payload = { sections: sections, part2: { numDrawers: parseInt(calcForm.querySelector('[name="numDrawers"]')?.value) || 0, doors_0_36: parseInt(calcForm.querySelector('[name="doors_0_36"]')?.value) || 0, doors_36_60: parseInt(calcForm.querySelector('[name="doors_36_60"]')?.value) || 0, doors_60_82: parseInt(calcForm.querySelector('[name="doors_60_82"]')?.value) || 0, lazySusanQty: parseInt(calcForm.querySelector('[name="lazySusanQty"]')?.value) || 0, totalDoors: globalTotalDoors }, part3: { customPaintQty: parseInt(calcForm.querySelector('[name="customPaintQty"]')?.value) || 0, calculateDisposal: calcForm.querySelector('[name="calculateDisposal"]')?.value || 'no' }, priceSetup: { pricePerDoor: parseFloat(calcForm.querySelector('[name="pricePerDoor"]')?.value) || 0, pricePerDrawer: parseFloat(calcForm.querySelector('[name="pricePerDrawer"]')?.value) || 0, refinishingCostPerSqFt: parseFloat(calcForm.querySelector('[name="refinishingCostPerSqFt"]')?.value) || 0, pricePerLazySusan: parseFloat(calcForm.querySelector('[name="pricePerLazySusan"]')?.value) || 0, onSiteMeasuring: parseFloat(calcForm.querySelector('[name="onSiteMeasuring"]')?.value) || 0, doorDisposalCost: parseFloat(calcForm.querySelector('[name="doorDisposalCost"]')?.value) || 0, onSiteMeasuringSqFt: globalTotalSqFt } };
        console.log("[Client Ctr] Payload:", JSON.stringify(payload, null, 2));
        const response = await fetch('/calculate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); console.log("[Client Ctr] Fetch status:", response.status);
        let responseData = {}; const responseBodyText = await response.text();
        if (!response.ok) { try { responseData = JSON.parse(responseBodyText); } catch(e) {} const errorMessage = responseData?.error || responseData?.message || responseBodyText || `HTTP error! Status: ${response.status}`; const error = new Error(errorMessage); error.status = response.status; console.error("Fetch error:", error); throw error; }
        try { responseData = JSON.parse(responseBodyText); } catch (jsonError) { console.error("JSON parse error:", jsonError, "Body:", responseBodyText); throw new Error(`Invalid JSON. Body: ${responseBodyText.substring(0, 100)}...`); }
        console.log("[Client Ctr] Calculation success."); displayResults(responseData); // Calls displayResults which includes scroll
    } catch (err) { console.error("Calculation Error:", err); let displayErrorMessage = err.message || 'Unknown error.'; if (err.status) displayErrorMessage = `Server error (${err.status}).`; else if (!err.status && (err.message.includes("dimension") || err.message.includes("add at least one section"))) displayErrorMessage = err.message; else displayErrorMessage = `Calculation failed. (${err.message})`; resultsDiv.innerHTML = `<div class="invoice-error"><p><strong>Error Calculating:</strong></p><p>${escapeHTML(displayErrorMessage)}</p></div>`; if(outputActionsContainer) outputActionsContainer.style.display = 'none'; }
}

/** Handles printing using an iframe - Fallback Method */
async function printViaIframe() {
    console.log('[Client Ctr] Attempting print via iframe...');
    const invoiceElement = document.querySelector('#results .invoice'); if (!invoiceElement) { console.error("Cannot print: Invoice element not found."); alert("Error: Could not find estimate content."); return; }
    const internalDetailsDiv = document.getElementById('internalDetails'); const includeInternalDetails = internalDetailsDiv && internalDetailsDiv.classList.contains('print-section'); console.log("[Client Ctr] Include internal details in iframe print:", includeInternalDetails);
    const printFrame = document.createElement('iframe'); printFrame.style.position = 'absolute'; printFrame.style.width = '0'; printFrame.style.height = '0'; printFrame.style.border = '0'; printFrame.style.visibility = 'hidden'; printFrame.setAttribute('aria-hidden', 'true'); printFrame.setAttribute('srcdoc', `<!DOCTYPE html><html><head><title>-</title></head><body></body></html>`); document.body.appendChild(printFrame);
    printFrame.onload = () => { console.log("[Client Ctr] iframe load complete."); try { const frameDoc = printFrame.contentWindow.document; frameDoc.open(); frameDoc.write(`<!DOCTYPE html><html><head><title>Print Estimate - nuDoors Contractor</title><style>
/* --- EMBEDDED PRINT STYLES --- */
@media print{ @page{size:A4;margin:1cm}body{background:#fff!important;color:#000!important;margin:0!important;padding:0!important;font-family:Arial,sans-serif!important;font-size:10pt!important;line-height:1.3;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;height:auto!important;width:auto!important;overflow:visible!important}header,#toggleInstructionsContainer,#instructions,#exampleImage,#calcForm>*:not(#results),#roughEstimateContainer,#mainConfigRow,#priceSetupContainer,#otherPartsContainer,#formActions,#printButtonContainer,#themeToggleBtn,small,button,input,select,#togglePriceSetupBtn,#toggleInstructionsBtn,.toggle-details-btn,#outputActionsContainer,#emailEstimateContainer{display:none!important;visibility:hidden!important}#internalDetails:not(.print-section){display:none!important;visibility:hidden!important}#results{display:block!important;visibility:visible!important;margin:0!important;padding:0!important;border:none!important;width:100%!important;overflow:visible!important;position:static!important}.invoice{visibility:visible!important;display:block!important;width:100%!important;max-width:100%!important;margin:0!important;padding:0!important;border:none!important;box-shadow:none!important;background:#fff!important;color:#000!important;border-radius:0!important;font-size:10pt!important;position:static!important;overflow:visible!important}.invoice>*{visibility:visible!important;color:#000!important;background:0 0!important}.invoice-header{text-align:center;border-bottom:2px solid #000!important;padding-bottom:.8em!important;margin-bottom:1.5em!important}.invoice-header img.invoice-logo{display:block!important;max-height:60px;margin:0 auto .5em;filter:grayscale(100%)}.invoice-header h1{font-size:16pt!important;font-weight:700!important;margin-bottom:.1em!important}.invoice-header p{font-size:9pt!important;margin:.2em 0!important}.invoice h2,.invoice h3{font-size:12pt!important;font-weight:700!important;margin-top:1.2em!important;margin-bottom:.6em!important;border-bottom:1px solid #666!important;padding-bottom:.2em!important;text-align:left!important;page-break-after:avoid!important}.invoice h2:first-of-type,.invoice h3:first-of-type{margin-top:0!important}.invoice table td,.invoice table th{display:table-cell!important;visibility:visible!important;border:1px solid #ccc!important;padding:5px 8px!important;text-align:left!important;vertical-align:top!important;color:#000!important;background:#fff!important;box-shadow:none!important;word-wrap:break-word;position:static!important}.invoice table td::before,.invoice table th::before{content:none!important;display:none!important;padding:0!important;margin:0!important;position:static!important;width:auto!important;left:auto!important}.invoice table{display:table!important;width:100%!important;border-collapse:collapse!important;margin-bottom:1.5em!important;font-size:9pt!important;border-spacing:0!important;page-break-inside:auto;table-layout:auto!important}.invoice table thead{display:table-header-group!important}.invoice table tbody{display:table-row-group!important}.invoice table tr{display:table-row!important;page-break-inside:avoid!important}.invoice thead th{background-color:#eee!important;font-weight:700!important;border-bottom:1px solid #999!important}.invoice .details-table td:first-child{text-align:left!important}.invoice .details-table td:last-child{text-align:right!important}.invoice .summary-table .table-label{text-align:left!important;font-weight:400!important;width:70%;border-right:none!important}.invoice .summary-table .table-value{text-align:right!important;font-weight:400!important;border-left:none!important}.invoice tfoot{border-top:none!important;display:table-footer-group!important}.invoice .summary-table tfoot tr{page-break-inside:avoid!important;display:table-row!important}.invoice .total-row{background-color:#fff!important;border-top:2px solid #000!important}.invoice .total-row td{font-weight:700!important;font-size:11pt!important;border:none!important;border-top:2px solid #000!important;padding:6px 8px!important;color:#000!important;display:table-cell!important}.invoice .total-row .table-label{text-align:right!important;width:auto!important;padding-right:1em}.invoice .total-row .table-value{text-align:right!important}.estimate-footer{text-align:center!important;margin-top:2em!important;padding-top:1em!important;border-top:1px solid #ccc!important;font-size:8pt!important;color:#333!important;page-break-before:auto}#internalDetails{display:none!important;visibility:hidden!important;height:0!important;overflow:hidden!important;margin:0!important;padding:0!important;border:none!important}#internalDetails.print-section{display:block!important;visibility:visible!important;height:auto!important;overflow:visible!important;margin-top:1.5em!important;padding:1em!important;border:1px solid #ccc!important;page-break-before:auto;background:#f8f8f8!important;color:#000!important}#internalDetails.print-section *{visibility:visible!important;color:#000!important;background:0 0!important}#internalDetails.print-section h3{font-size:11pt!important;margin-bottom:.5em!important;border-bottom:1px solid #666!important;padding-bottom:.2em!important;text-align:left!important;page-break-after:avoid!important}#internalDetails.print-section table{font-size:9pt!important;margin-bottom:.5em!important;table-layout:auto!important;display:table!important;width:100%!important;border-collapse:collapse!important;border-spacing:0!important;page-break-inside:auto}#internalDetails.print-section table tbody{display:table-row-group!important}#internalDetails.print-section table tr{display:table-row!important;page-break-inside:avoid!important}#internalDetails.print-section table td{border:1px solid #ddd!important;padding:4px 6px!important;background:#fff!important;display:table-cell!important;visibility:visible!important;color:#000!important;text-align:left!important;vertical-align:top!important;position:static!important}#internalDetails.print-section table td::before{content:none!important;display:none!important}#internalDetails.print-section td:first-child{text-align:left!important;width:70%}#internalDetails.print-section td:last-child{text-align:right!important;width:30%}.invoice-error,.invoice-loading{display:none!important}}
/* Minimal Base Styles */ body{font-family:Arial,sans-serif;font-size:10pt;line-height:1.3;color:#000;margin:0;padding:0}h1,h2,h3{margin:1em 0 .5em;padding:0}p{margin:0 0 .5em;padding:0}table{border-collapse:collapse;width:100%;margin-bottom:1em;font-size:9pt}th,td{border:1px solid #ccc;padding:5px 8px;text-align:left;vertical-align:top}th{background-color:#eee;font-weight:700}tfoot{font-weight:700}.total-row td{border-top:2px solid #000;font-size:11pt}.invoice{margin:0;padding:0}.details-section{margin-top:1.5em;padding:1em;border:1px solid #ccc;background:#f8f8f8}.details-section h3{font-size:11pt;margin-bottom:.5em}.details-section table td{border:1px solid #ddd;padding:4px 6px}.details-section td:last-child{text-align:right}
            </style></head><body>${invoiceElement.outerHTML}</body></html>`);
        frameDoc.close();
        setTimeout(() => { try { if (printFrame.contentWindow && printFrame.contentWindow.document.body.innerHTML.length > 0) { console.log('[Client Ctr] iframe content ready, printing...'); printFrame.contentWindow.focus(); printFrame.contentWindow.print(); console.log('[Client Ctr] iframe print sent.'); } else { console.error('[Client Ctr] iframe content empty.'); alert("Error preparing print view."); } } catch(printError) { console.error('[Client Ctr] Error printing iframe:', printError); alert("Error trying to print."); } finally { setTimeout(() => { if (printFrame.parentNode === document.body) { document.body.removeChild(printFrame); console.log('[Client Ctr] iframe removed.'); } }, 1000); } }, 350);
    } catch (error) { console.error('[Client Ctr] Error creating iframe:', error); alert("Error preparing print view."); if (printFrame && printFrame.parentNode === document.body) { document.body.removeChild(printFrame); } }
    };
    printFrame.onerror = (err) => { console.error("[Client Ctr] iframe onerror:", err); alert("Failed to load print content."); if (printFrame.parentNode === document.body) { document.body.removeChild(printFrame); } };
}

/** Handles print request, trying execCommand first, then iframe */
function handlePrintRequest() {
    console.log('[Client Ctr] Print button clicked. Preparing...');
    const internalDetailsDiv = document.getElementById('internalDetails');
    if (internalDetailsDiv) { internalDetailsDiv.classList.toggle('print-section', internalDetailsDiv.style.display !== 'none'); console.log(`[Client Ctr] Toggled .print-section: ${internalDetailsDiv.classList.contains('print-section')}`); }
    let printedViaExec = false;
    try {
        console.log("[Client Ctr] Trying execCommand...");
        printedViaExec = document.execCommand('print', false, null);
        if (printedViaExec) { console.log("[Client Ctr] execCommand succeeded."); }
        else { console.log("[Client Ctr] execCommand returned false. Falling back."); printViaIframe(); }
    } catch (err) {
        console.error("[Client Ctr] execCommand failed:", err);
        console.log("[Client Ctr] Falling back to iframe print.");
        printViaIframe();
    }
}

/** NEW: Handle Sending Estimate Email */
async function handleSendEmail() {
    if (!clientEmailInput || !sendEmailBtn || !emailStatusDiv) { console.error("[Client Ctr] Email elements not ready."); return; }
    const email = clientEmailInput.value.trim();
    // Use stored result data to generate HTML
    if (!lastCalculationResult) { emailStatusDiv.textContent = 'Error: No estimate data to send.'; emailStatusDiv.className = 'error'; return; }
    if (!email || !email.includes('@') || email.length < 5) { emailStatusDiv.textContent = 'Please enter a valid client email address.'; emailStatusDiv.className = 'error'; clientEmailInput.focus(); return; }

    const estimateHtml = generateEmailHtml(lastCalculationResult); // Generate email-specific HTML
    if (!estimateHtml || estimateHtml.length < 50) { emailStatusDiv.textContent = 'Error: Could not generate email content.'; emailStatusDiv.className = 'error'; return; }

    emailStatusDiv.textContent = 'Sending...'; emailStatusDiv.className = 'sending'; sendEmailBtn.disabled = true; sendEmailBtn.textContent = 'Sending...';
    try {
        const response = await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientEmail: email, estimateHtml: estimateHtml }) });
        const result = await response.json();
        if (!response.ok) { throw new Error(result.error || `Server error ${response.status}`); }
        emailStatusDiv.textContent = result.message || 'Email sent successfully!'; emailStatusDiv.className = 'success'; clientEmailInput.value = '';
    } catch (error) { console.error("[Client Ctr] Error sending email:", error); emailStatusDiv.textContent = `Error: ${error.message}`; emailStatusDiv.className = 'error';
    } finally {
        sendEmailBtn.disabled = false; sendEmailBtn.textContent = 'Send Email';
        setTimeout(() => { if (emailStatusDiv.className !== 'error') { emailStatusDiv.textContent = ''; emailStatusDiv.className = ''; } }, 5000);
    }
}

/** Set up wizard navigation and general button listeners */
function initializeWizard() {
    console.log("[Client Ctr] Initializing wizard listeners...");
    printEstimateBtn = document.getElementById('printEstimate');
    sendEmailBtn = document.getElementById('sendEmailBtn'); // Assign email button

    if (typeof handleCalculate !== 'function') { console.error("FATAL: handleCalculate missing!"); alert("Init Error: Calc function missing."); return; }
    if (typeof handlePrintRequest !== 'function') { console.error("FATAL: handlePrintRequest missing!"); alert("Init Error: Print function missing."); return; }
    if (typeof handleSendEmail !== 'function') { console.error("FATAL: handleSendEmail missing!"); alert("Init Error: Email function missing."); return; }


    themeToggleBtn.addEventListener('click', handleThemeToggle);
    togglePriceSetupBtn.addEventListener('click', () => { const isCollapsed = priceSetupContainer.classList.toggle('collapsed'); togglePriceSetupBtn.textContent = isCollapsed ? 'Show' : 'Hide'; });
    toggleInstructionsBtn.addEventListener('click', () => { const isHidden = instructionsDiv.style.display === 'none'; instructionsDiv.style.display = isHidden ? 'block' : 'none'; toggleInstructionsBtn.textContent = isHidden ? 'Hide Directions' : 'Show Directions'; });
    addSectionBtn.addEventListener('click', () => { const index = sectionsContainer.children.length; sectionsContainer.appendChild(createRoughEstimateSection(index)); updateTotals(); });
    clearAllBtn.addEventListener('click', () => { console.log("[Client Ctr] Clear All."); document.querySelectorAll('#roughEstimateContainer input, #roughEstimateContainer select, #otherPartsContainer input, #otherPartsContainer select').forEach(el => { if (el.closest('#priceSetupContainer')) return; if (el.type === 'number') el.value = el.getAttribute('value') || '0'; else if (el.type === 'text') el.value = ''; else if (el.tagName === 'SELECT') { if(el.name === 'calculateDisposal') { el.value = 'no'; } else { el.selectedIndex = 0; } } }); sectionsContainer.innerHTML = ''; for (let i = 0; i < 2; i++) { sectionsContainer.appendChild(createRoughEstimateSection(i)); } updateSectionIndices(); loadPricingSettings(); priceSetupContainer.classList.remove('collapsed'); togglePriceSetupBtn.textContent = 'Hide'; if (instructionsDiv) instructionsDiv.style.display = 'none'; toggleInstructionsBtn.textContent = 'Show Directions'; resultsDiv.innerHTML = ''; outputActionsContainer = outputActionsContainer || document.getElementById('outputActionsContainer'); if (outputActionsContainer) outputActionsContainer.style.display = 'none'; clientEmailInput = clientEmailInput || document.getElementById('clientEmailInput'); if(clientEmailInput) clientEmailInput.value = ''; emailStatusDiv = emailStatusDiv || document.getElementById('emailStatus'); if(emailStatusDiv) { emailStatusDiv.textContent = ''; emailStatusDiv.className = ''; } updateTotals(); console.log("[Client Ctr] Clear All finished."); });

    calcForm.addEventListener('submit', handleCalculate);

    if (printEstimateBtn) { printEstimateBtn.addEventListener('click', handlePrintRequest); }
    else { console.warn("[Client Ctr] Print Estimate button not found."); }

    if (sendEmailBtn) { sendEmailBtn.addEventListener('click', handleSendEmail); }
    else { console.warn("[Client Ctr] Send Email button not found."); }

    console.log("[Client Ctr] Event listeners attached.");
}

/** Initial setup */
function main() {
    console.log("[Client Ctr] DOMContentLoaded fired.");
    sectionsContainer = document.getElementById('sectionsContainer'); addSectionBtn = document.getElementById('addSectionBtn'); calcForm = document.getElementById('calcForm'); priceSetupContainer = document.getElementById('priceSetupContainer'); togglePriceSetupBtn = document.getElementById('togglePriceSetupBtn'); clearAllBtn = document.getElementById('clearAllBtn'); resultsDiv = document.getElementById('results'); printBtnContainer = document.getElementById('printButtonContainer'); instructionsDiv = document.getElementById('instructions'); toggleInstructionsBtn = document.getElementById('toggleInstructionsBtn'); themeToggleBtn = document.getElementById('themeToggleBtn');
    outputActionsContainer = document.getElementById('outputActionsContainer'); emailEstimateContainer = document.getElementById('emailEstimateContainer'); clientEmailInput = document.getElementById('clientEmailInput'); sendEmailBtn = document.getElementById('sendEmailBtn'); emailStatusDiv = document.getElementById('emailStatus');

    const criticalElements = [ sectionsContainer, addSectionBtn, calcForm, priceSetupContainer, togglePriceSetupBtn, clearAllBtn, resultsDiv, printBtnContainer, instructionsDiv, toggleInstructionsBtn, themeToggleBtn, outputActionsContainer, emailEstimateContainer, clientEmailInput, sendEmailBtn, emailStatusDiv ];
    if (criticalElements.some(el => !el)) { console.error("CRITICAL ERROR: One or more essential HTML elements not found."); document.body.innerHTML = '<h1 style="color: red;">Error: UI failed to initialize.</h1>'; return; }
    console.log("[Client Ctr] Essential elements refs obtained.");

    loadInitialTheme();
    try { console.log("[Client Ctr] Loading settings..."); loadPricingSettings(); console.log("[Client Ctr] Settings loaded."); } catch (error) { console.error("Error loading settings:", error); }

    sectionsContainer.innerHTML = '';
    for (let i = 0; i < 2; i++) { sectionsContainer.appendChild(createRoughEstimateSection(i)); }
    updateSectionIndices(); updateTotals();

    console.log("[Client Ctr] Type of handleCalculate before calling initializeWizard:", typeof handleCalculate);
    initializeWizard();

    console.log("[Client Ctr] DOMContentLoaded setup complete.");
}

// --- Run main ---
document.addEventListener('DOMContentLoaded', main);

console.log("Contractor script.js: File finished parsing.");