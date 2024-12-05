document.addEventListener('DOMContentLoaded', () => {
    displayAllEnvelopes();
    displaySingleEnvelope();
    displayUpdatePool();
});


// Read envelope(s)
const displayAllEnvelopes = async () => {
    try {
        const response = await fetch('/api/envelope/all');
        const envelopes = await response.json();

        if (!response.ok) {
            document.querySelector('#title').style.display = 'block';
            document.querySelector('#title-two').style.display = 'none';
            document.querySelector('#note-about-envelope-budgeting').style.display = 'block';
            document.querySelector('html').style.padding = '100px';
            document.querySelector('#search-container').style.display = 'none';
            document.querySelector('.envelopes-table-container-outer').style.display = 'none';
            document.querySelector('#transfer-funds-container').style.display = 'none';
            document.querySelector('#update-pool-container').style.display = 'none';

            return;
        }

        document.querySelector('#title').style.display = 'none';
        document.querySelector('#title-two').style.display = 'block';
        document.querySelector('#note-about-envelope-budgeting').style.display = 'none';
        document.querySelector('html').style.padding = '25px 100px';
        document.querySelector('#search-container').style.display = 'block';
        document.querySelector('.envelopes-table-container-outer').style.display = 'block';
        document.querySelector('#transfer-funds-container').style.display = 'block';
        document.querySelector('#update-pool-container').style.display = 'block';

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

                if (header === 'amount') {
                    cell.textContent = `$${envelope[header]}`;
                } else {
                    cell.textContent = envelope[header];
                }

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
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');

    const navigateToEnvelope = (envelope) => {
        const category = envelope['category'].trim();

        showPage(envelopePage);
        envelopeCategoryMsg.textContent = category;
        enterTableInfo(envelope, thead, tbody);

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

            const searchInput = event.target.querySelector('#category-search');
            const category = searchInput.value.trim();
            const envelope = await fetchEnvelope(category, thead, tbody, envelopePage, envelopeCategoryMsg);

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

    const category = creationForm.querySelector('#category').value.trim();
    const amount = creationForm.querySelector('#amount').value;

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

        const responseMsg = await response.json();
        const msg = responseMsg['msg'];

        if (!response.ok) {
            alert(`Error: ${msg}!`);
        }

        try {
            await fetch(
                '/api/update-pool/new', 
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ msg })
                }
            );
        } catch (error) {
            console.error(`Error adding message to update pool: ${error}`);
        }

        creationForm.reset();
        window.location.reload();

    } catch (error) {
        alert('Something happened while we were creating the envelope. This is on our side, not yours. Please try again.');
    }
});


// Update envelopes
const updateForm = document.querySelector('#update-amount-form');

updateForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const envelopeCategoryMsg = document.querySelector('#envelope-category-msg').textContent.trim();
    const category = encodeURIComponent(envelopeCategoryMsg.toLowerCase());
    
    const amount = updateForm.querySelector('#amount').value;

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

        const responseMsg = await response.json();
        const msg = responseMsg['msg'];

        if (!response.ok) {
            alert(`Error: ${msg}!`);
        }

        try {
            await fetch(
                '/api/update-pool/new',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ msg })
                }
            );
        } catch (error) {
            console.error(`Error adding message to update pool: ${error}`);
        }

        updateForm.reset();
        showEnvelopePage(envelopeCategoryMsg);

    } catch (error) {
        alert('Something happened while we were updating the envelope. This is on our side, not yours. Please try again.');
    }
});


const subtractForm = document.querySelector('#subtract-amount-form');

subtractForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const envelopeCategoryMsg = document.querySelector('#envelope-category-msg').textContent.trim();
    const category = encodeURIComponent(envelopeCategoryMsg.toLowerCase());

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

        const responseMsg = await response.json();
        const msg = responseMsg['msg'];

        if (!response.ok) {
            alert(`Error: ${msg}!`);
        }

        try {
            await fetch(
                '/api/update-pool/new',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ msg })
                }
            );
        } catch (error) {
            console.error(`Error adding message to update pool: ${error}`);
        }

        subtractForm.reset();
        showEnvelopePage(envelopeCategoryMsg);

    } catch (error) {
        alert('Something happened while we were updating the envelope. This is on our side, not yours. Please try again.');
    }
});


const transferForm = document.querySelector('#transfer-funds-form');

transferForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const categoryFrom = document.querySelector('#transfer-funds-form #categoryFrom').value.trim();
    const categoryTo = document.querySelector('#transfer-funds-form #categoryTo').value.trim();
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

        const responseMsg = await response.json();
        const msg = responseMsg['msg'];

        if (!response.ok) {
            alert(`Error: ${msg}!`);
        }

        try {
            await fetch(
                '/api/update-pool/new',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ msg })
                }
            );
        } catch (error) {
            console.error(`Error adding message to update pool: ${error}`);
        }

        transferForm.reset();
        window.location.reload();

    } catch (error) {
        alert('Something happened while we were updating the envelope. This is on our side, not yours. Please try again.');
    }
});


// Delete envelope
const deleteEnvelopeButton = document.querySelector('#delete-envelope-button');

deleteEnvelopeButton.addEventListener('click', async () => {
    const confirmDeletion = confirm('Last chance! Are you sure you want to delete this envelope? This action cannot be undone.');

    const envelopeCategoryMsg = document.querySelector('#envelope-category-msg').textContent.trim();
    const category = encodeURIComponent(envelopeCategoryMsg.toLowerCase());

    if (confirmDeletion) {
        try {
            const response = await fetch(
                `/api/envelope/${category}/delete`,
                {method: 'DELETE'}
            );

            const responseMsg = await response.json();
            const msg = responseMsg['msg'];

            if (!response.ok) {
                alert(`Error: ${msg}!`);
            }

            try {
                await fetch(
                    '/api/update-pool/new',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ msg })
                    }
                );
            } catch (error) {
                console.error(`Error adding message to update pool: ${error}`);
            }

            window.location.href = '/';

        } catch (error) {
            alert('Something happened while we were deleting the envelope. This is on our side, not yours. Please try again.');
        }

    } else {
        try {
            await fetch(
                '/api/update-pool/new',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ msg: `Deletion for "${envelopeCategoryMsg}" envelope was cancelled` })
                }
            );
        } catch (error) {
            console.error(`Error adding message to update pool: ${error}`);
        }
    }
});


// Return to home
const returnToHomeButton = document.querySelector('#return-to-home-button');
returnToHomeButton.addEventListener('click', () => window.location.href = '/');


// Update pool
const displayUpdatePool = async () => {
    try {
        const response = await fetch('/api/update-pool/all');
        const updatePool = await response.json();

        if (!response.ok) {
            alert(`Oops! ${updatePool['error']}!`);
            return;
        }

        const updatePoolDiv = document.querySelector('#update-pool');
        updatePoolDiv.innerHTML = '';

        for (let i=updatePool.length - 1; i>=0; i--) {
            const p = document.createElement('p');
            p.textContent = updatePool[i];
            updatePoolDiv.appendChild(p);
        }

    } catch (error) {
        alert('Something happened while we were updating the pool. This is on our side, not yours. Please try again.');
    }
}


// Helper functions
const showPage = (pageToShow) => {
    const pagesToHide = document.querySelectorAll('.page');

    pagesToHide.forEach((page) => {
        page.classList.remove('active');
    });

    pageToShow.classList.add('active');
};

const enterTableInfo = (envelope, thead, tbody) => {
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

        if (header === 'amount') {
            cell.textContent = `$${envelope[header]}`;
        } else {
            cell.textContent = envelope[header];
        }

        row.appendChild(cell);
    });

    tbody.appendChild(row);
};

const fetchEnvelope = async (category, thead, tbody, envelopePage, envelopeCategoryMsg) => {
    if (category.trim() === "") {
        return;
    }

    try {
        const response = await fetch(`/api/envelope/${encodeURIComponent(category.toLowerCase())}`);
        const envelope = await response.json();

        if (!response.ok) {
            showPage(envelopePage);

            envelopeCategoryMsg.textContent = `${envelope['msg']}! Your search '${category}' has no matches. Perhaps you made a typo?`;

            thead.innerHTML = '';
            tbody.innerHTML = '';

            document.querySelector('#update-amount-container').style.display = 'none';
            document.querySelector('#subtract-amount-container').style.display = 'none';
            document.querySelector('#danger-zone').style.display = 'none';

            return;
        }

        document.querySelector('#update-amount-container').style.display = 'block';
        document.querySelector('#subtract-amount-container').style.display = 'block';
        document.querySelector('#danger-zone').style.display = 'block';

        return envelope;

    } catch (error) {
        alert('Something happened while we were fetching the envelope. This is on our side, not yours. Please try again.');
    }
};

const showEnvelopePage = async (category) => {
    const table = document.querySelector('#envelope-single-table');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    const envelopePage = document.querySelector('#about-envelope-single');
    const envelopeCategoryMsg = document.querySelector('#envelope-category-msg');

    showPage(envelopePage);
    const envelope = await fetchEnvelope(category, thead, tbody, envelopePage, envelopeCategoryMsg);
    enterTableInfo(envelope, thead, tbody);
};
