// Display envelope(s)
document.addEventListener('DOMContentLoaded', () => {
    displayAllEnvelopes();
    displaySingleEnvelope();
});


const displayAllEnvelopes = async () => {
    try {
        const response = await fetch('/api/envelope/all');
        const envelopes = await response.json();

        if (!response.ok) {
            const envelopesContainer = document.querySelector('#envelopes-container');
            const noEnvelopesMsg = document.createElement('p');

            noEnvelopesMsg.textContent = `${envelopes['error']}!<br>Where are the envelopes? Starting creating some below!`;
            envelopesContainer.appendChild(noEnvelopesMsg);

            return;
        }

        const table = document.querySelector('#envelopes-table');
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');

        thead.innerHTML = '';
        tbody.innerHTML = '';

        const headers = Object.keys(envelopes[0]);

        const headerRow = document.createElement('tr');
        headers.forEach((header) => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);

        envelopes.forEach((envelope) => {
            const row = document.createElement('tr');

            headers.forEach((header) => {
                const cell = document.createElement('td');
                cell.textContent = envelope[header];
                row.appendChild(cell);
            });

            tbody.appendChild(row);
        });
    } catch (error) {
        alert('Something happened while we were fetching the envelopes. This is on our side, not yours. Please try again.');
    }
};


const displaySingleEnvelope = async () => {
    const mainPage = document.querySelector('#about-envelope-all');
    const envelopePage = document.querySelector('#about-envelope-single');
    const searchForms = document.querySelectorAll('#search-form');
    const envelopeCategoryMsg = document.querySelector('#envelope-category-msg');
    const table = document.querySelector('#envelope-single-table');

    const showPage = (pageToShow) => {
        const pagesToHide = document.querySelectorAll('.page');

        pagesToHide.forEach((page) => {
            page.classList.remove('active');
        });

        pageToShow.classList.add('active');
    };

    const enterTableInfo = (envelope) => {
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');

        thead.innerHTML = '';
        tbody.innerHTML = '';

        const headers = Object.keys(envelope);
        
        const headerRow = document.createElement('tr');
        headers.forEach((header) => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);

        const row = document.createElement('tr');
        headers.forEach((header) => {
            const cell = document.createElement('td');
            cell.textContent = envelope[header];
            row.appendChild(cell);
        });

        tbody.appendChild(row);
    };

    const fetchEnvelope = async (category) => {
        try {
            const response = await fetch(`/api/envelope/${encodeURIComponent(category)}`);
            const envelope = await response.json();

            if (!response.ok) {
                envelopeCategoryMsg.textContent = `${envelope['error']}<br>Perhaps you made a typo?`;
                return;
            }

            return envelope;

        } catch (error) {
            alert('Something happened while we were fetching the envelope. This is on our side, not yours. Please try again.');
        }
    };

    const navigateToEnvelope = (envelope) => {
        const category = envelope['category'].trim();

        showPage(envelopePage);
        envelopeCategoryMsg.textContent = category;
        enterTableInfo(envelope);

        history.pushState(
            {page: 'envelope', category: category},
            '',
            `/api/envelope/${encodeURIComponent(category)}`
        );
    };

    const navigateToMain = () => {
        showPage(mainPage);

        history.pushState(
            {page: 'main'},
            '',
            '/'
        );
    };

    searchForms.forEach((form) => {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const searchInput = this.querySelector('#category-search');
            const category = searchInput.value.trim();
            const envelope = await fetchEnvelope(category);

            navigateToEnvelope(envelope);
            searchInput.value = '';
        });
    });

    window.addEventListener('popstate', async (event) => {
        if (event.state) {
            if (event.state.page === 'envelope') {
                showPage(envelopePage);
                envelopeCategoryMsg.textContent = event.state.category.trim();
                enterTableInfo(await fetchEnvelope(event.state.category.trim()));
            } else {
                showPage(mainPage);
            }
        } else {
            showPage(mainPage);
        }
    });

    const initializePage = async () => {
        const path = window.location.pathname;

        if (path.startsWith('/envelope/')) {
            const category = decodeURIComponent(path.replace('/envelope/', ''));
            navigateToEnvelope(await fetchEnvelope(category));
        } else {
            navigateToMain();
        }
    };

    initializePage();
};


// Create envelopes
const creationForm = document.querySelector('#envelope-creation-form');

creationForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const category = document.querySelector('#category').value;
    const amount = document.querySelector('#envelope-creation-form #amount').value;

    try {
        const response = await fetch(
            '/api/envelope/new',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ category, amount })
            }
        );

        const newEnvelope = await response.json();

        const updatePool = document.querySelector('#pool');
        const updatePoolMsg = document.createElement('p');

        if (!response.ok) {
            alert(`Error: ${newEnvelope['error']}!`);

            updatePoolMsg.textContent = `Create envelope error: ${newEnvelope['error']}. Please try again!`;
            updatePool.appendChild(updatePoolMsg);
            return;
        }

        updatePoolMsg.textContent = `Your latest envelope!:<br>${newEnvelope}`;
        updatePool.appendChild(updatePoolMsg);

        creationForm.reset();

    } catch (error) {
        alert('Something happened while we were creating the envelope. This is on our side, not yours. Please try again.');
    }
});


// Envelope category
const envelopeCategoryMsg = document.querySelector('#envelope-category-msg').textContent.trim();


// Update envelopes
const updateForm = document.querySelector('#update-amount-form');

updateForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const category = encodeURIComponent(envelopeCategoryMsg);
    const amount = document.querySelector('#update-amount-form #amount').value;

    try {
        const response = await fetch(
            `/api/envelope/${category}/update`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amount })
            }
        );

        const updatedEnvelope = await response.json();

        const updatePool = document.querySelector('#pool');
        const updatePoolMsg = document.createElement('p');

        if (!response.ok) {
            alert(`Error: ${updatedEnvelope['error']}!`);

            updatePoolMsg.textContent = `Update envelope error: ${updatedEnvelope['error']}. Please try again!`;
            updatePool.appendChild(updatePoolMsg);
            return;
        }

        updatePoolMsg.textContent = `Your newly updated '${envelopeCategoryMsg}' envelope!:<br>${updatedEnvelope}`;
        updatePool.appendChild(updatePoolMsg);

        updateForm.reset();

    } catch (error) {
        alert('Something happened while we were updating the envelope. This is on our side, not yours. Please try again.');
    }
});


const subtractForm = document.querySelector('#subtract-amount-form');

subtractForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const category = encodeURIComponent(envelopeCategoryMsg);
    const amountToSubtract = document.querySelector('#subtract-amount-form #amount').value;

    try {
        const response = await fetch(
            `/api/envelope/${category}/update/subtract`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amount: amountToSubtract })
            }
        );

        const updatedEnvelope = await response.json();

        const updatePool = document.querySelector('#pool');
        const updatePoolMsg = document.createElement('p');

        if (!response.ok) {
            alert(`Error: ${updatedEnvelope['error']}!`);

            updatePoolMsg.textContent = `Subtracting funds from envelope error: ${updatedEnvelope['error']}. Please try again!`;
            updatePool.appendChild(updatePoolMsg);
            return;
        }

        updatePoolMsg.textContent = `Your newly updated '${envelopeCategoryMsg}' envelope!:<br>${updatedEnvelope}`;
        updatePool.appendChild(updatePoolMsg);

        subtractForm.reset();

    } catch (error) {
        alert('Something happened while we were updating the envelope. This is on our side, not yours. Please try again.');
    }
});


const transferForm = document.querySelector('#transfer-funds-form');

transferForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const categoryFrom = document.querySelector('#transfer-funds-form #categoryFrom').value;
    const categoryTo = document.querySelector('#transfer-funds-form #categoryTo').value;
    const amountToTransfer = document.querySelector('#transfer-funds-form #amount').value;

    try {
        const response = await fetch(
            '/api/envelope/transfer',
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ categoryFrom, categoryTo, amountToTransfer })
            }
        );

        const envelopes = await response.json();

        const updatePool = document.querySelector('#pool');
        const updatePoolMsg = document.createElement('p');

        if (!response.ok) {
            alert(`Error: ${envelopes['error']}!`);

            updatePoolMsg.textContent = `Transferring funds error: ${envelopes['error']}. Please try again!`;
            updatePool.appendChild(updatePoolMsg);
            return;
        }

        updatePoolMsg.textContent = `Transfer amount:<br>${amountToTransfer}<br>From envelope:<br>${envelopes['envelopeFrom']}<br>To envelope:<br>${envelopes['envelopeTo']}`;
        updatePool.appendChild(updatePoolMsg);

        transferForm.reset();

    } catch (error) {
        alert('Something happened while we were updating the envelope. This is on our side, not yours. Please try again.');
    }
});


// Delete envelope
const deleteEnvelopeButton = document.querySelector('#delete-envelope-button');

deleteEnvelopeButton.addEventListener('click', async () => {
    const confirmDeletion = confirm('Last chance! Are you sure you want to delete this envelope? This action cannot be undone.');

    const updatePool = document.querySelector('#pool');
    const updatePoolMsg = document.createElement('p');

    if (confirmDeletion) {
        try {
            const category = encodeURIComponent(envelopeCategoryMsg);

            const response = await fetch(`/api/envelope/${category}/delete`);
            const deleteMsg = response.json();

            if (!response.ok) {
                alert(`Error: ${deleteMsg['error']}!`);

                updatePoolMsg.textContent = `Deleting envelope error: ${deleteMsg['error']}. Please try again!`;
                updatePool.appendChild(updatePoolMsg);
                return;
            }

            updatePoolMsg.textContent = `Your '${envelopeCategoryMsg}' envelope has successfully been deleted!`;
            updatePool.appendChild(updatePoolMsg);

        } catch (error) {
            alert('Something happened while we were deleting the envelope. This is on our side, not yours. Please try again.');
        }

    } else {
        updatePoolMsg.textContent = `Your '${envelopeCategoryMsg}' envelope has not been deleted.`;
        updatePool.appendChild(updatePoolMsg);
    }
});
