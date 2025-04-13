// --- FILE: public/script.js (CONTRACTOR VERSION) ---

console.log("Contractor script.js: File loading...");

// --- Hardcoded Style Lists (Simpler than fetching for now) ---
const doorStyles = [
  "Shaker", "Slab", "Chamfer", "Savannah", "Beaded", "Stepped", "Ruth", "Maisie",
  "Mavis", "Dorothy", "Raised Panel", "Split Shaker", "Jean", "Nora", "Amelia",
  "Millie", "Glass", "Frances", "Alice", "Mabel", "Bessie", "Winona", "Eleanor", "Georgia"
].sort(); // Keep sorted
const drawerStyles = doorStyles.filter(style =>
  !["Glass", "Georgia", "Split Shaker", "Winona", "Bessie", "Nora"].includes(style)
).sort(); // Keep sorted

// --- Global variables ---
let globalTotalSqFt = 0;
let globalTotalDoors = 0; // Actual doors entered
let globalTotalDrawers = 0;

// --- DOM Element References (Declare globally, assign in DOMContentLoaded) ---
let sectionsContainer, addSectionBtn, calcForm, priceSetupContainer, togglePriceSetupBtn,
    clearAllBtn, resultsDiv, printBtnContainer, instructionsDiv, toggleInstructionsBtn,
    themeToggleBtn, printEstimateBtn;

// --- Theme Handling ---
const K_THEME = 'nuDoorsContractorTheme'; // Use a different key for contractor app

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.dataset.theme = 'dark';
        if(themeToggleBtn) themeToggleBtn.textContent = '🌙'; // Moon icon
        localStorage.setItem(K_THEME, 'dark');
    } else {
        document.body.removeAttribute('data-theme');
        if(themeToggleBtn) themeToggleBtn.textContent = '☀️'; // Sun icon
        localStorage.setItem(K_THEME, 'light');
    }
    console.log(`[Client Contractor] Theme applied: ${theme}`);
}

function handleThemeToggle() {
    const currentTheme = document.body.dataset.theme;
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

function loadInitialTheme() {
    const savedTheme = localStorage.getItem(K_THEME);
    // Check system preference if no theme saved
    const themeToApply = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    // Ensure themeToggleBtn exists before trying to set its textContent
    themeToggleBtn = themeToggleBtn || document.getElementById('themeToggleBtn');
    applyTheme(themeToApply);
}
// --- End Theme Handling ---

/** Function to update global totals */
const updateTotals = function() {
    try {
        const sections = document.querySelectorAll('#sectionsContainer .section');
        let totalSqFt = 0;
        sections.forEach(sec => {
            const height = parseFloat(sec.querySelector('input[name="sectionHeight"]')?.value) || 0;
            const width = parseFloat(sec.querySelector('input[name="sectionWidth"]')?.value) || 0;
            if (height > 0 && width > 0) {
                totalSqFt += (height * width) / 144;
            }
        });
        globalTotalSqFt = totalSqFt;

        const doors0 = parseInt(document.querySelector('input[name="doors_0_36"]')?.value) || 0;
        const doors36 = parseInt(document.querySelector('input[name="doors_36_60"]')?.value) || 0;
        const doors60 = parseInt(document.querySelector('input[name="doors_60_82"]')?.value) || 0;
        globalTotalDoors = doors0 + doors36 + doors60;
        globalTotalDrawers = parseInt(document.querySelector('input[name="numDrawers"]')?.value) || 0;

         // Optional: Display totals somewhere for debugging/user feedback
         // console.log(`Updated totals: SqFt=${globalTotalSqFt.toFixed(2)}, Doors=${globalTotalDoors}, Drawers=${globalTotalDrawers}`);

    } catch (error) {
        console.error("Error in updateTotals:", error);
    }
};

/** Creates a dynamic Rough Estimate section. */
function createRoughEstimateSection(index) {
    console.log(`[Client Contractor] Creating section ${index + 1}`);
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'section';
    sectionDiv.dataset.index = index;

    // Optimized HTML generation
    const doorOptions = doorStyles.map(s => `<option value="${s}">${escapeHTML(s)}</option>`).join('');
    const drawerOptions = drawerStyles.map(s => `<option value="${s}">${escapeHTML(s)}</option>`).join('');

    sectionDiv.innerHTML = `
      <div class="section-header">
         <span class="section-id">Section ${index + 1}</span>
         ${index > 0 ? '<button type="button" class="remove-button" title="Remove Section">×</button>' : ''} <!-- Add remove button only if index > 0 -->
      </div>
      <label> Door Style: <select name="sectionDoorStyle" required>${doorOptions}</select> </label>
      <label> Drawer Style: <select name="sectionDrawerStyle" required>${drawerOptions}</select> </label>
      <label> Finish:
        <select name="sectionFinish" required>
          <option value="Painted" selected>Painted</option>
          <!-- Add other specific paint options if needed, or keep simple -->
          <option value="Primed">Primed</option>
          <option value="Unfinished">Unfinished</option>
        </select>
      </label>
      <div class="dimension-inputs">
        <label> Height (in): <input type="number" name="sectionHeight" value="12" min="0.1" step="0.01" required inputmode="decimal"/> </label>
        <label> Width (in): <input type="number" name="sectionWidth" value="12" min="0.1" step="0.01" required inputmode="decimal"/> </label>
      </div>
    `;

     // Add event listener for the remove button if it exists
    const removeBtn = sectionDiv.querySelector('.remove-button');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            sectionDiv.remove();
            updateSectionIndices();
            updateTotals(); // Recalculate totals after removal
        });
    }

    // Add listeners to inputs/selects within this section
    sectionDiv.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('change', updateTotals);
        // Use 'input' for number fields for real-time updates if desired
        if (input.type === 'number') {
            input.addEventListener('input', updateTotals);
        }
    });
    return sectionDiv;
}

/** Updates the indices and potentially remove buttons for dynamic sections. */
function updateSectionIndices() {
    const sections = document.querySelectorAll('#sectionsContainer .section');
    sections.forEach((sec, idx) => {
      sec.dataset.index = idx;
      const sectionIdSpan = sec.querySelector('.section-id');
      if (sectionIdSpan) sectionIdSpan.textContent = `Section ${idx + 1}`;

      // Ensure only sections after the first have a remove button visible
       let removeBtn = sec.querySelector('.remove-button');
       if (idx === 0 && removeBtn) {
           removeBtn.remove(); // Remove button from first section if it exists
       } else if (idx > 0 && !removeBtn) {
            // Add remove button if missing (e.g., after removing the original second section)
            const header = sec.querySelector('.section-header');
            if (header) {
                 removeBtn = document.createElement('button');
                 removeBtn.type = 'button';
                 removeBtn.className = 'remove-button';
                 removeBtn.title = 'Remove Section';
                 removeBtn.innerHTML = '×'; // Use times symbol
                 removeBtn.addEventListener('click', () => {
                     sec.remove();
                     updateSectionIndices();
                     updateTotals();
                 });
                 header.appendChild(removeBtn);
            }
       }
    });
}

/** Loads pricing settings AND disposal setting from localStorage. */
function loadPricingSettings() {
    const pricingFields = [
      'pricePerDoor', 'pricePerDrawer', 'refinishingCostPerSqFt',
      'pricePerLazySusan', 'onSiteMeasuring', 'doorDisposalCost'
    ];
    pricingFields.forEach(fieldName => {
        const input = document.querySelector(`#priceSetupContainer [name="${fieldName}"]`);
        if (input) {
            const savedValue = localStorage.getItem(`contractor_${fieldName}`); // Use prefixed key
            if (savedValue !== null) {
                input.value = savedValue;
            } else if (input.getAttribute('value')) {
                 // If nothing saved, use default HTML value
                 input.value = input.getAttribute('value');
            }
            // Add listener to save on change
            input.addEventListener('change', saveSetting);
            if (input.type === 'number') {
                 input.addEventListener('input', saveSetting);
            }
        } else {
             console.warn(`Input field not found for saving/loading: ${fieldName}`);
        }
    });

    // Load disposal setting separately
    const disposalSelect = document.querySelector('#specialFeatures select[name="calculateDisposal"]');
    if (disposalSelect) {
        const savedDisposal = localStorage.getItem('contractor_calculateDisposal'); // Use prefixed key
        disposalSelect.value = savedDisposal || 'no'; // Default to 'no' if not saved
        disposalSelect.addEventListener('change', saveSetting); // Add listener here too
    } else {
         console.warn("Disposal select field not found for saving/loading.");
    }
    // No need to call saveCurrentSettings here, listeners handle saves
}

/** Saves a specific setting field's value to localStorage. */
function saveSetting(e) {
    if (e.target.name) {
      localStorage.setItem(`contractor_${e.target.name}`, e.target.value); // Use prefixed key
       console.log(`[Client Contractor] Saved setting: ${e.target.name} = ${e.target.value}`);
    }
}


/** Helper function to format currency. */
function formatCurrency(value) {
    const number = Number(value);
    if (isNaN(number)) return '$0.00';
    return number.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

/** Helper function to escape HTML */
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
         .replace(/&/g, "&")
         .replace(/</g, "<")
         .replace(/>/g, ">")
         .replace(/"/g, "")
         .replace(/'/g, "'");
}

/** Display calculation results (Contractor Version) */
function displayResults(resultData) {
    console.log("[Client Contractor] Displaying results:", resultData);
    if (!resultData || typeof resultData !== 'object' || resultData.error) {
        const errorMsg = resultData?.error || 'Invalid or missing data received from server.';
        resultsDiv.innerHTML = `<div class="invoice-error"><p><strong>Error processing results:</strong></p><p>${escapeHTML(errorMsg)}</p></div>`;
        if (printBtnContainer) printBtnContainer.style.display = 'none';
        return;
    }

    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Safely access nested properties with defaults from the result object
    const specialFeatures = resultData.specialFeatures || {};
    const installation = resultData.installation || {};
    const part2 = resultData.part2 || {};
    const part3 = resultData.part3 || {};
    const priceSetup = resultData.priceSetup || {}; // Rates used

    const overallTotal = formatCurrency(resultData.overallTotal);
    const allSectionsCost = formatCurrency(resultData.doorCostTotal);
    const hingeCost = formatCurrency(resultData.hingeCost);
    const refinishingCost = formatCurrency(resultData.refinishingCost);
    const measuringCost = formatCurrency(resultData.measuringCost);
    const disposalCostVal = resultData.disposalCost || 0;
    const disposalCost = formatCurrency(disposalCostVal);
    const customPaintCostVal = specialFeatures.customPaintCost || 0;
    const customPaintCost = formatCurrency(customPaintCostVal);
    const totalInstallCost = formatCurrency(installation.totalInstall);
    const lazySusanQty = part2.lazySusanQty ?? 0;
    const lazySusanSurcharge = formatCurrency(resultData.lazySusanSurcharge); // Get calculated surcharge

    const costToInstaller = formatCurrency(resultData.costToInstaller);
    const profitMargin = formatCurrency(resultData.profitMargin);

    // Use counts directly from part2 for display consistency
    const doors0_36 = part2.doors_0_36 ?? 0;
    const doors36_60 = part2.doors_36_60 ?? 0;
    const doors60_82 = part2.doors_60_82 ?? 0;
    const totalActualDoors = doors0_36 + doors36_60 + doors60_82; // Re-calc actual doors for clarity
    const totalDrawers = part2.numDrawers ?? 0;

    const hingeCount = resultData.hingeCount ?? 'N/A';
    const doorsForDisposal = resultData.doorsForDisposal ?? 0;
    const drawersForDisposal = resultData.drawersForDisposal ?? 0;
    const lazySusansForDisposal = resultData.lazySusansForDisposal ?? 0;
    const calculateDisposalFlag = part3.calculateDisposal === 'yes';

    let html = `
      <div class="invoice">
        <div class="invoice-header">
           <h1>Project Estimate</h1>
           <p>Date: ${dateStr}</p>
           <p>Estimate ID: ${Date.now()}</p>
        </div>

        <h2>Summary of Charges</h2>
        <table class="summary-table">
          <tbody>
            <tr><td class="table-label">Door & Drawer Fronts (All Sections)</td><td class="table-value">${allSectionsCost}</td></tr>
            <tr><td class="table-label">Hinge & Hardware Charge</td><td class="table-value">${hingeCost}</td></tr>
            ${customPaintCostVal > 0 ? `<tr><td class="table-label">Custom Paint Fee</td><td class="table-value">${customPaintCost}</td></tr>` : ''}
            ${lazySusanQty > 0 ? `<tr><td class="table-label">Lazy Susan Surcharge</td><td class="table-value">${lazySusanSurcharge}</td></tr>` : ''}
            <tr><td class="table-label">Refinishing (${(resultData.priceSetup?.onSiteMeasuringSqFt || 0).toFixed(2)} sq ft @ ${formatCurrency(priceSetup.refinishingCostPerSqFt || 0)}/sqft)</td><td class="table-value">${refinishingCost}</td></tr>
            <tr><td class="table-label">On-Site Measuring</td><td class="table-value">${measuringCost}</td></tr>
            <tr><td class="table-label">Installation (${totalActualDoors} Doors, ${totalDrawers} Drawers, ${lazySusanQty} LS)</td><td class="table-value">${totalInstallCost}</td></tr>
            ${disposalCostVal > 0 ? `<tr><td class="table-label">Disposal Fee</td><td class="table-value">${disposalCost}</td></tr>` : ''}
          </tbody>
          <tfoot>
            <tr class="total-row"><td class="table-label">Estimated Project Total</td><td class="table-value">${overallTotal}</td></tr>
          </tfoot>
        </table>

        <button type="button" id="toggleDetailsBtn">Show Internal Details</button>
        <div id="internalDetails" class="details-section" style="display: none;">
            <h3>Internal Cost & Count Breakdown</h3>
             <table class="details-table">
                 <tr><td>Total Actual Doors (0-36"):</td><td>${doors0_36}</td></tr>
                 <tr><td>Total Actual Doors (36-60"):</td><td>${doors36_60}</td></tr>
                 <tr><td>Total Actual Doors (60-82"):</td><td>${doors60_82}</td></tr>
                 <tr><td>Total Drawers:</td><td>${totalDrawers}</td></tr>
                 <tr><td>Number of Lazy Susans:</td><td>${lazySusanQty}</td></tr>
                 <tr><td>Total Hinge Count:</td><td>${hingeCount}</td></tr>
                 <tr style="height: 1em;"><td colspan="2"></td></tr> <!-- Spacer -->
                 <tr><td>Installation Rate - Doors:</td><td>${formatCurrency(priceSetup.pricePerDoor)} / door</td></tr>
                 <tr><td>Installation Rate - Drawers:</td><td>${formatCurrency(priceSetup.pricePerDrawer)} / drawer</td></tr>
                 <tr><td>Installation Rate - Lazy Susans:</td><td>${formatCurrency(priceSetup.pricePerLazySusan)} / LS</td></tr>
                 <tr><td>Installation Subtotal - Doors:</td><td>${formatCurrency(installation.doorInstall)}</td></tr>
                 <tr><td>Installation Subtotal - Drawers:</td><td>${formatCurrency(installation.drawerInstall)}</td></tr>
                 <tr><td>Installation Subtotal - Lazy Susans:</td><td>${formatCurrency(installation.lazySusanInstall)}</td></tr>
                 <tr style="height: 1em;"><td colspan="2"></td></tr> <!-- Spacer -->
                 ${calculateDisposalFlag ? `
                     <tr><td>Disposal Rate:</td><td>${formatCurrency(priceSetup.doorDisposalCost)} / unit</td></tr>
                     <tr><td>   Units (Doors):</td><td>${doorsForDisposal}</td></tr>
                     <tr><td>   Units (Drawers):</td><td>${drawersForDisposal}</td></tr>
                     <tr><td>   Units (Lazy Susans x2):</td><td>${lazySusansForDisposal * 2}</td></tr>
                     <tr><td>Calculated Disposal Cost:</td><td>${disposalCost}</td></tr>
                 ` : `
                     <tr><td colspan="2">Disposal Cost Not Included</td></tr>
                 `}
                 <tr style="height: 1em;"><td colspan="2"></td></tr> <!-- Spacer -->
                 <tr><td>Cost To Installer (Sections + Hinges):</td><td>${costToInstaller}</td></tr>
                 <tr><td>Profit Margin:</td><td>${profitMargin}</td></tr>
             </table>
        </div>
        <p class="estimate-footer">Thank you for choosing nuDoors! This estimate is valid for 30 days.</p>
      </div>
    `;

    resultsDiv.innerHTML = html;

    // Re-attach listener for the new details toggle button
    const toggleBtn = document.getElementById('toggleDetailsBtn');
    const detailsDiv = document.getElementById('internalDetails');
    if (toggleBtn && detailsDiv) {
        // Ensure initial state
        detailsDiv.style.display = 'none';
        toggleBtn.textContent = 'Show Internal Details';
        detailsDiv.classList.remove('print-section');

        toggleBtn.addEventListener('click', () => {
            const isHidden = detailsDiv.style.display === 'none';
            detailsDiv.style.display = isHidden ? 'block' : 'none';
            toggleBtn.textContent = isHidden ? 'Hide Internal Details' : 'Show Internal Details';
            // Add/remove class for printing logic
             detailsDiv.classList.toggle('print-section', !isHidden);
        });
         console.log("[Client Contractor] Toggle Details listener attached.");
    } else {
        console.error("[Client Contractor] Toggle Details button or div not found after results display.");
    }

    if(printBtnContainer) printBtnContainer.style.display = 'block'; // Show print button
}


// --- Main Execution ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("[Client Contractor] DOMContentLoaded event fired.");

    // --- Assign Global DOM References ---
    sectionsContainer = document.getElementById('sectionsContainer');
    addSectionBtn = document.getElementById('addSectionBtn');
    calcForm = document.getElementById('calcForm');
    priceSetupContainer = document.getElementById('priceSetupContainer');
    togglePriceSetupBtn = document.getElementById('togglePriceSetupBtn');
    clearAllBtn = document.getElementById('clearAllBtn');
    resultsDiv = document.getElementById('results');
    printBtnContainer = document.getElementById('printButtonContainer');
    instructionsDiv = document.getElementById('instructions');
    toggleInstructionsBtn = document.getElementById('toggleInstructionsBtn');
    themeToggleBtn = document.getElementById('themeToggleBtn');
    printEstimateBtn = document.getElementById('printEstimate'); // Specific button for print

    // --- Check Essential Elements ---
    const criticalElements = [ sectionsContainer, addSectionBtn, calcForm, priceSetupContainer, togglePriceSetupBtn, clearAllBtn, resultsDiv, printBtnContainer, instructionsDiv, toggleInstructionsBtn, themeToggleBtn, printEstimateBtn ];
    if (criticalElements.some(el => !el)) {
        console.error("CRITICAL ERROR: One or more essential HTML elements not found. Check IDs.");
        criticalElements.forEach((el, i) => { if (!el) console.error(`Missing element index ${i} in check list.`); }); // Log which one is missing
        document.body.innerHTML = '<h1 style="color: red;">Error: Application UI failed to initialize. Please check console.</h1>';
        return;
    }
    console.log("[Client Contractor] Essential elements references obtained.");

    // --- Load Theme First ---
    loadInitialTheme();

    // --- Load Pricing Settings ---
    try {
        console.log("[Client Contractor] Loading settings...");
        loadPricingSettings();
        console.log("[Client Contractor] Settings loaded.");
    } catch (error) {
        console.error("Error during loadPricingSettings:", error);
    }

    // --- Attach Listeners ---
    // Theme Toggle
    themeToggleBtn.addEventListener('click', handleThemeToggle);

    // Price Setup Toggle
    togglePriceSetupBtn.addEventListener('click', () => {
        const isCollapsed = priceSetupContainer.classList.toggle('collapsed');
        togglePriceSetupBtn.textContent = isCollapsed ? 'Show' : 'Hide';
    });

    // Instructions Toggle
    toggleInstructionsBtn.addEventListener('click', () => {
        const isHidden = instructionsDiv.style.display === 'none';
        instructionsDiv.style.display = isHidden ? 'block' : 'none';
        toggleInstructionsBtn.textContent = isHidden ? 'Hide Directions' : 'Show Directions';
    });

    // Add Section
    addSectionBtn.addEventListener('click', () => {
        const index = sectionsContainer.children.length;
        sectionsContainer.appendChild(createRoughEstimateSection(index));
        updateTotals(); // Update totals when adding
    });

    // Clear All
    clearAllBtn.addEventListener('click', () => {
        console.log("[Client Contractor] Clear All button clicked.");
        // Reset forms excluding price setup
         document.querySelectorAll('#roughEstimateContainer input, #roughEstimateContainer select, #otherPartsContainer input, #otherPartsContainer select').forEach(el => {
             if (el.closest('#priceSetupContainer')) return; // Skip price setup
             if (el.type === 'number') el.value = el.getAttribute('value') || '0';
             else if (el.type === 'text') el.value = '';
             else if (el.tagName === 'SELECT') {
                 // Explicitly set disposal to 'no'
                 if(el.name === 'calculateDisposal') {
                     el.value = 'no';
                 } else {
                     el.selectedIndex = 0;
                 }
             }
         });

        // Re-initialize sections (creates default 2)
        sectionsContainer.innerHTML = ''; // Clear existing first
        for (let i = 0; i < 2; i++) { // Add default 2 sections
             sectionsContainer.appendChild(createRoughEstimateSection(i));
        }
        updateSectionIndices(); // Ensure correct indices/buttons


        // Restore Price Setup values only (already handled by loadPricingSettings on load/saveSetting on change)
        // Re-applying here might be redundant but safe if defaults change
        loadPricingSettings();


        priceSetupContainer.classList.remove('collapsed'); // Ensure price setup visible
        togglePriceSetupBtn.textContent = 'Hide';
        if (instructionsDiv) instructionsDiv.style.display = 'none'; // Hide instructions
        toggleInstructionsBtn.textContent = 'Show Directions';

        resultsDiv.innerHTML = ''; // Clear results
        if (printBtnContainer) printBtnContainer.style.display = 'none'; // Hide print button

        updateTotals(); // Update totals based on reset values
        console.log("[Client Contractor] Clear All finished.");
    });

    // Form Submission
    calcForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("[Client Contractor] Form submitted.");

        // Show loading indicator
        resultsDiv.innerHTML = '<div class="invoice-loading"><p>Calculating...</p></div>';
        if(printBtnContainer) printBtnContainer.style.display = 'none';

        try {
            updateTotals(); // Ensure totals are current before building payload
            console.log("[Client Contractor] Totals updated for submit.");

            // --- Build Contractor Payload ---
            const sections = [];
            document.querySelectorAll('#sectionsContainer .section').forEach(sec => {
                // Basic validation within loop
                const heightInput = sec.querySelector('input[name="sectionHeight"]');
                const widthInput = sec.querySelector('input[name="sectionWidth"]');
                const height = parseFloat(heightInput?.value) || 0;
                const width = parseFloat(widthInput?.value) || 0;

                if (height <= 0 || width <= 0) {
                    console.warn(`Skipping section ${sec.dataset.index + 1} due to invalid dimensions.`);
                     // Optionally provide user feedback here
                     heightInput.style.border = '1px solid red';
                     widthInput.style.border = '1px solid red';
                    return; // Skip this section
                }
                 heightInput.style.border = ''; // Clear border if valid
                 widthInput.style.border = '';

                 sections.push({
                    doorStyle: sec.querySelector('select[name="sectionDoorStyle"]')?.value || '',
                    drawerStyle: sec.querySelector('select[name="sectionDrawerStyle"]')?.value || '',
                    finish: sec.querySelector('select[name="sectionFinish"]')?.value || '',
                    height: height,
                    width: width
                 });
            });

            if (sections.length === 0 && document.querySelectorAll('#sectionsContainer .section').length > 0) {
                 throw new Error("All sections have invalid dimensions (Height and Width must be > 0).");
            }


            const formData = new FormData(e.target); // Use the form directly
            const payload = {
              sections: sections,
              part2: {
                numDrawers: parseInt(formData.get('numDrawers')) || 0,
                doors_0_36: parseInt(formData.get('doors_0_36')) || 0,
                doors_36_60: parseInt(formData.get('doors_36_60')) || 0,
                doors_60_82: parseInt(formData.get('doors_60_82')) || 0,
                lazySusanQty: parseInt(formData.get('lazySusanQty')) || 0,
                totalDoors: globalTotalDoors // Send calculated actual door count
              },
              part3: {
                customPaintQty: parseInt(formData.get('customPaintQty')) || 0,
                calculateDisposal: formData.get('calculateDisposal') || 'no'
              },
              priceSetup: { // Use get to retrieve values from form data
                pricePerDoor: parseFloat(formData.get('pricePerDoor')) || 0,
                pricePerDrawer: parseFloat(formData.get('pricePerDrawer')) || 0,
                refinishingCostPerSqFt: parseFloat(formData.get('refinishingCostPerSqFt')) || 0,
                pricePerLazySusan: parseFloat(formData.get('pricePerLazySusan')) || 0,
                onSiteMeasuring: parseFloat(formData.get('onSiteMeasuring')) || 0,
                doorDisposalCost: parseFloat(formData.get('doorDisposalCost')) || 0,
                onSiteMeasuringSqFt: globalTotalSqFt // Send calculated SqFt
              }
            };
            // --- End Payload Construction ---

            console.log("[Client Contractor] Payload constructed:", JSON.stringify(payload, null, 2));

            const response = await fetch('/calculate', { // Endpoint defined in server.js
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            console.log("[Client Contractor] Fetch response status:", response.status);

            let responseData = {};
            const responseBodyText = await response.text(); // Get text first for debugging

            if (!response.ok) {
                // Try to parse error from JSON body, otherwise use text
                try { responseData = JSON.parse(responseBodyText); } catch(e) {}
                const errorMessage = responseData?.error || responseData?.message || responseBodyText || `HTTP error! Status: ${response.status} ${response.statusText}`;
                const error = new Error(errorMessage);
                error.status = response.status;
                console.error("Fetch response not OK:", error);
                throw error;
            }

            // If response IS ok, parse JSON
            try {
                responseData = JSON.parse(responseBodyText);
            } catch (jsonError) {
                 console.error("Could not parse successful response as JSON:", jsonError, "Body:", responseBodyText);
                 throw new Error(`Invalid JSON received from server despite OK status. Body: ${responseBodyText.substring(0, 100)}...`);
            }


            console.log("[Client Contractor] Fetch successful. Displaying results...");
            displayResults(responseData);


        } catch (err) {
            console.error("Calculation Fetch/Process Error:", err);
            let displayErrorMessage = err.message || 'An unknown error occurred during calculation.';
            // Simplify error message for user
            if (err.status) displayErrorMessage = `Server error (${err.status}). Please check inputs or contact support.`;
            else if (!err.status && err.message.includes("dimension")) displayErrorMessage = err.message; // Show validation error
            else displayErrorMessage = `Calculation failed. Please check inputs or try again. (${err.message})`;

            resultsDiv.innerHTML = `<div class="invoice-error"><p><strong>Error Calculating Estimate:</strong></p><p>${escapeHTML(displayErrorMessage)}</p></div>`;
            if(printBtnContainer) printBtnContainer.style.display = 'none';
        }
    });

    // --- Print Logic ---
    printEstimateBtn.addEventListener('click', () => {
        // Ensure details are correctly classed BEFORE printing
        const detailsDiv = document.getElementById('internalDetails');
        if (detailsDiv) { // Check if detailsDiv exists (i.e., results have been shown)
             detailsDiv.classList.toggle('print-section', detailsDiv.style.display !== 'none');
        }
         window.print(); // Trigger print dialog
    });

    // --- Initialize Sections (start with 2) ---
    sectionsContainer.innerHTML = ''; // Clear just in case
    for (let i = 0; i < 2; i++) {
        sectionsContainer.appendChild(createRoughEstimateSection(i));
    }
    updateSectionIndices(); // Ensure buttons/IDs are correct
    updateTotals(); // Calculate initial totals

    console.log("[Client Contractor] DOMContentLoaded setup complete.");

}); // End DOMContentLoaded

console.log("Contractor script.js: File finished parsing.");