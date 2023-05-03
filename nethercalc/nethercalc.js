// Get the forms and input fields
const overworldForm = document.getElementById('overworld-form');
const netherForm = document.getElementById('nether-form');
const oxInput = document.getElementById('ox');
const ozInput = document.getElementById('oz');
const nxInput = document.getElementById('nx');
const nzInput = document.getElementById('nz');

// Add event listeners to the input fields
oxInput.addEventListener('input', handleInput);
ozInput.addEventListener('input', handleInput);
nxInput.addEventListener('input', handleInput);
nzInput.addEventListener('input', handleInput);

oxInput.addEventListener('keypress', validateInput);
ozInput.addEventListener('keypress', validateInput);
nxInput.addEventListener('keypress', validateInput);
nzInput.addEventListener('keypress', validateInput);

function validateInput(event) {
    const charCode = event.which ? event.which : event.keyCode;
    const char = String.fromCharCode(charCode);
    const regex = /^[-]?\d*\.?\d*$/;

    if (!regex.test(char)) {
        event.preventDefault();
    }
}



function handleInput(event) {
    const changedInput = event.target;
    // Get the values of the input fields
    const oxValue = oxInput.value;
    const ozValue = ozInput.value;
    const nxValue = nxInput.value;
    const nzValue = nzInput.value;

    switch (changedInput) {
        case oxInput:
            nxInput.value = convertToNether(oxValue);
            break;
        case ozInput:
            nzInput.value = convertToNether(ozValue);
            break;
        case nxInput:
            oxInput.value = convertToOverworld(nxValue);
            break;
        case nzInput:
            ozInput.value = convertToOverworld(nzValue);
            break;
    }


    function convertToNether(coord) {
        return coord / 8;
    }

    function convertToOverworld(coord) {
        return coord * 8;
    }
}