let devData, prodData;

document.getElementById('devFile').addEventListener('change', handleFileSelect);
document.getElementById('prodFile').addEventListener('change', handleFileSelect);
document.getElementById('compareButton').addEventListener('click', compareFiles);
document.getElementById('copyButton').addEventListener('click', copyOutput);
document.getElementById('darkModeToggle').addEventListener('change', toggleDarkMode);

function handleFileSelect(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = JSON.parse(e.target.result);
        if (event.target.id === 'devFile') {
            devData = data;
            document.getElementById('devFileName').textContent = `Uploaded: ${file.name}`;
        } else {
            prodData = data;
            document.getElementById('prodFileName').textContent = `Uploaded: ${file.name}`;
        }
    };
    reader.readAsText(file);
}

function compareFiles() {
    if (!devData || !prodData) {
        alert("Please upload both Dev and Prod JSON files.");
        return;
    }

    const nameSysCreatedByMapDev = createNameMap(devData.records);
    const nameSysCreatedByMapProd = createNameMap(prodData.records);

    const groupedByCreatedBy = {};
    for (const record of devData.records) {
        // Skip records with state = "ignore"
        if (record.state === "ignore") {
            continue;
        }
        
        const name = record.name || "No name found";
        const createdBy = record.sys_created_by || "Unknown";

        if (!nameSysCreatedByMapProd.hasOwnProperty(name)) {
            if (!groupedByCreatedBy[createdBy]) {
                groupedByCreatedBy[createdBy] = [];
            }
            groupedByCreatedBy[createdBy].push(record);  // Store full record, not just name
        }
    }

    displayResults(groupedByCreatedBy);
}

function createNameMap(records) {
    const map = {};
    records.forEach(record => {
        const name = record.name || "No name found";
        const createdBy = record.sys_created_by || "Unknown";
        map[name] = createdBy;
    });
    return map;
}


function displayResults(groupedByCreatedBy) {
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = '';  // Clear previous results

    for (const [createdBy, names] of Object.entries(groupedByCreatedBy)) {
        const groupHeader = document.createElement('div');
        groupHeader.textContent = `Created By: ${createdBy}`;
        outputDiv.appendChild(groupHeader);

        // Sort names alphabetically before displaying
        names.sort();
        names.forEach(record => {
            const nameDiv = document.createElement('div');
            nameDiv.textContent = `  - Name: ${record.name || 'No name found'}`;
            nameDiv.style.marginLeft = '20px';
            outputDiv.appendChild(nameDiv);
        });
        

        outputDiv.appendChild(document.createElement('br'));
        document.getElementById('copyButton').style.display = 'inline-block';

        // Update button event to call navigateToPreservePage with the grouped data
        document.getElementById('preserveButton').addEventListener('click', () => navigateToPreservePage(groupedByCreatedBy));
    }

    // Show copy button when output is available
    document.getElementById('copyButton').style.display = 'inline-block';
}



function copyOutput() {
    const outputDiv = document.getElementById('output');
    const range = document.createRange();
    range.selectNodeContents(outputDiv);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    try {
        document.execCommand('copy');
        alert('Output copied to clipboard!');
    } catch (err) {
        alert('Failed to copy output.');
    }

    selection.removeAllRanges();  // Clear selection
}

function toggleDarkMode(event) {
    document.body.classList.toggle('light-mode', !event.target.checked);
    document.body.classList.toggle('dark-mode', event.target.checked);
}

// Existing code...

function navigateToPreservePage(groupedData) {
    localStorage.setItem('preservationData', JSON.stringify(groupedData));
    window.location.href = 'preserve.html';
}

