document.getElementById('preserveAllButton').addEventListener('click', preserveAll);
document.getElementById('preserveMineButton').addEventListener('click', preserveMine);
document.getElementById('copySysIdsButton').addEventListener('click', copySelectedSysIds);

const preservationData = JSON.parse(localStorage.getItem('preservationData') || '{}');
if (Object.keys(preservationData).length === 0) {
    alert("No preservation data found. Please start from the first page.");
}

document.getElementById('toggleAllButton').addEventListener('click', toggleAll);

function toggleAll() {
    const checkboxes = document.querySelectorAll('#recordList input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = !allChecked;  // Toggle all checkboxes
    });
}

function preserveAll() {
    document.getElementById('preserveSection').style.display = 'block';

    const recordList = document.getElementById('recordList');
    recordList.innerHTML = '';  // Clear any previous content
    document.getElementById('createdByDropdown').style.display = 'none';
    recordList.style.display = 'block';

    for (const [createdBy, records] of Object.entries(preservationData)) {
        // Add a section heading for "Created By" with spacing
        const sectionHeader = document.createElement('div');
        sectionHeader.textContent = `Created By: ${createdBy}`;
        sectionHeader.style.fontWeight = 'bold';  // Make the createdBy header bold
        sectionHeader.style.marginTop = '20px';  // Add space above the section heading
        sectionHeader.style.marginBottom = '10px';  // Add space below the section heading
        recordList.appendChild(sectionHeader);

        // Add each record under this heading
        records.forEach(record => {
            const recordElement = createRecordCheckbox(record.sys_id, record.name);
            recordList.appendChild(recordElement);
        });
    }

    document.getElementById('copySysIdsButton').style.display = 'inline-block';
}

function preserveMine() {
    // Show the preserve section
    document.getElementById('preserveSection').style.display = 'block';

    const dropdown = document.getElementById('createdByDropdown');
    dropdown.style.display = 'inline-block';
    dropdown.innerHTML = '<option>Select Created By</option>';

    for (const createdBy of Object.keys(preservationData)) {
        const option = document.createElement('option');
        option.value = createdBy;
        option.textContent = createdBy;
        dropdown.appendChild(option);
    }

    dropdown.addEventListener('change', (event) => {
        displayRecordsByCreator(event.target.value);
    });
}


function displayRecordsByCreator(creator) {
    const recordList = document.getElementById('recordList');
    recordList.innerHTML = '';  // Clear previous entries
    const records = preservationData[creator] || [];

    records.forEach(record => {
        const recordElement = createRecordCheckbox(record.sys_id, record.name);
        recordList.appendChild(recordElement);
    });
    document.getElementById('copySysIdsButton').style.display = 'inline-block';
}

function createRecordCheckbox(sysId, name) {
    const container = document.createElement('div');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = sysId;
    checkbox.checked = true;  // Default all checkboxes to true initially
    const label = document.createElement('label');
    label.textContent = name;

    container.appendChild(checkbox);
    container.appendChild(label);
    return container;
}

function copySelectedSysIds() {
    const selectedSysIds = Array.from(document.querySelectorAll('#recordList input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);

    if (selectedSysIds.length > 0) {
        const sysIdsString = selectedSysIds.join(', ');
        navigator.clipboard.writeText(sysIdsString).then(() => {
            alert('Sys IDs copied to clipboard!');
        }).catch(err => {
            alert('Failed to copy Sys IDs.');
        });
    } else {
        alert('No records selected.');
    }
}
