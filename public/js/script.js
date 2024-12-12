document.addEventListener('DOMContentLoaded', () => {
    checkState();
    displayAllEnvelopes();
    displayBudgetingPower();
    displayTotalBalance();
    displayUpdatePool();
    displayRandomEnvelopeSuggestion();
});


const checkState = async () => {
    const isDashboard = localStorage.getItem('isDashboard');

    if (isDashboard === 'true') {
        document.querySelector('#homepage').style.display = 'none';
        document.querySelector('#dashboard').style.display = 'block';
    } else {
        document.querySelector('#homepage').style.display = 'block';
        document.querySelector('#dashboard').style.display = 'none';
    }
};


// Read all envelopes
const displayAllEnvelopes = async () => {
    try {
        const response = await fetch('/api/envelope/all');
        const responseEnvelopes = await response.json();

        if (!response.ok) {
            document.querySelector('#no-envelope-msg').textContent = `${responseEnvelopes['msg']}! Create an envelope to get started budgeting!`;
            return;
        }

        const envelopes = responseEnvelopes['envelopes'];

        document.querySelector('#no-envelope-msg').display = 'none';

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


// Read budgeting information 
const displayBudgetingPower = async () => {
    try {
        const response = await fetch('/api/envelope/budgeting-power');
        const responseBudgetingPower = await response.json();
        const budgetingPower = responseBudgetingPower['budgetingPower'];

        const budgetingPowerP = document.querySelector('#budgeting-power');
        budgetingPowerP.textContent = `$${budgetingPower}`;

    } catch (error) {
        alert('Something happened while we were fetching the Budgeting Power. This is on our side, not yours. Please try again.');
    }
};


const displayTotalBalance = async () => {
    try {
        const response = await fetch('/api/envelope/total-balance');
        const responseTotalBalance = await response.json();
        const totalBalance = responseTotalBalance['totalBalance'];

        const totalBalanceP = document.querySelector('#total-balance');
        totalBalanceP.textContent = `$${totalBalance}`;

    } catch (error) {
        alert('Something happened while we were fetching the total balance. This is on our side, not yours. Please try again.');
    }
};


// Read updates
const displayUpdatePool = async () => {
    try {
        const response = await fetch('/api/update-pool/all');
        const updatePool = await response.json();

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
};


// Read random envelope
const displayRandomEnvelopeSuggestion = async () => {
    try {
        const response = await fetch('/api/envelope/all');
        const responseEnvelopes = await response.json();

        if (!response.ok || responseEnvelopes['envelopes'].length < 2) {
            document.querySelector('#category-from').placeholder = 'Create an envelope first!';
            document.querySelector('#category-to').placeholder = 'You need at least two envelopes!';
            document.querySelector('#transfer-amount').placeholder = 'P.S. Happy budgeting!';

            return;
        }

        const envelopes = responseEnvelopes['envelopes'];

        let randomEnvelopeOne = null;
        let randomEnvelopeTwo = null;

        while (randomEnvelopeOne === randomEnvelopeTwo) {
            randomEnvelopeOne = envelopes[Math.floor(Math.random() * envelopes.length)];
            randomEnvelopeTwo = envelopes[Math.floor(Math.random() * envelopes.length)];
        }

        document.querySelector('#category-from').placeholder = `Perhaps ${randomEnvelopeOne['category']}?`;
        document.querySelector('#category-to').placeholder = `How about ${randomEnvelopeTwo['category']}?`;
        document.querySelector('#transfer-amount').placeholder = '1500, 50, 700, etc.';
        
    } catch (error) {
        alert('Something happened while we were fetching the random envelope. This is on our side, not yours. Please try again.');
    }
};


// Read single envelope
const dashboardSearchForm = document.querySelector('#dashboard-search-form');

dashboardSearchForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const searchedCategory = dashboardSearchForm.querySelector('#dashboard-search-category').value.trim();
    const category = encodeURIComponent(searchedCategory.toLowerCase());

    if (searchedCategory === '') {
        return;
    }

    document.querySelector('#dashboard').style.display = 'none';
    document.querySelector('#search-results-page').style.display = 'block';

    try {
        const response = await fetch(`/api/envelope/${category}`);
        const responseEnvelope = await response.json();

        if (!response.ok) {
            document.querySelector('#search-results-search-category').value = searchedCategory;

            const searchResultsTitle = document.querySelector('#search-results-title')
            searchResultsTitle.textContent = `${responseEnvelope['msg']}! Your search '${searchedCategory}' has no matches. Perhaps you made a typo?`;
            searchResultsTitle.style.fontSize = '100px';
            searchResultsTitle.style.margin = '0px';
            searchResultsTitle.style.padding = '0px';

            document.querySelector('#envelope-information-container').style.display = 'none';
            document.querySelectorAll('#search-results-page .container').forEach((container) => {
                container.style.display = 'none';
            });
            document.querySelector('#danger-zone').style.display = 'none';

            return;
        }

        const envelope = responseEnvelope['envelope'];

        document.querySelector('#dashboard-search-category').value = searchedCategory;
        document.querySelector('#search-results-search-category').value = searchedCategory;

        const searchResultsTitle = document.querySelector('#search-results-title')
        searchResultsTitle.textContent = envelope['category'];
        searchResultsTitle.style.fontSize = '50px';

        document.querySelector('#envelope-information-container').style.display = 'block';
        document.querySelector('#current-balance').textContent = `$${envelope['amount']}`;
        document.querySelectorAll('#search-results-page .container').forEach((container) => {
            container.style.display = 'block';
        });
        document.querySelector('#danger-zone').style.display = 'block';

    } catch (error) {
        alert('Something happened while we were searching for the envelope. This is on our side, not yours. Please try again.');
    }
});


const searchResultsSearchForm = document.querySelector('#search-results-search-form');

searchResultsSearchForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const searchedCategory = searchResultsSearchForm.querySelector('#search-results-search-category').value.trim();
    const category = encodeURIComponent(searchedCategory.toLowerCase());

    if (searchedCategory === '') {
        return;
    }

    try {
        const response = await fetch(`/api/envelope/${category}`);
        const responseEnvelope = await response.json();

        if (!response.ok) {
            document.querySelector('#search-results-search-category').value = searchedCategory;

            const searchResultsTitle = document.querySelector('#search-results-title')
            searchResultsTitle.textContent = `${responseEnvelope['msg']}! Your search '${searchedCategory}' has no matches. Perhaps you made a typo?`;
            searchResultsTitle.style.fontSize = '100px';
            searchResultsTitle.style.margin = '0px';
            searchResultsTitle.style.padding = '0px';

            document.querySelector('#envelope-information-container').style.display = 'none';
            document.querySelectorAll('#search-results-page .container').forEach((container) => {
                container.style.display = 'none';
            });
            document.querySelector('#danger-zone').style.display = 'none';

            return;
        }

        const envelope = responseEnvelope['envelope'];

        document.querySelector('#search-results-search-category').value = searchedCategory;

        const searchResultsTitle = document.querySelector('#search-results-title')
        searchResultsTitle.textContent = envelope['category'];
        searchResultsTitle.style.fontSize = '50px';

        document.querySelector('#envelope-information-container').style.display = 'block';
        document.querySelector('#current-balance').textContent = `$${envelope['amount']}`;
        document.querySelectorAll('#search-results-page .container').forEach((container) => {
            container.style.display = 'block';
        });
        document.querySelector('#danger-zone').style.display = 'block';

    } catch (error) {
        alert('Something happened while we were searching for the envelope. This is on our side, not yours. Please try again.');
    }
});


// Create envelopes
const creationForm = document.querySelector('#envelope-creation-form');

creationForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const category = creationForm.querySelector('#creation-category').value.trim();
    const amount = creationForm.querySelector('#creation-amount').value;

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

        document.querySelector('#no-envelope-msg').style.display = 'none';

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


// Monthly income input
const incomeForm = document.querySelector('#income-input-form');

incomeForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const monthlyIncome = incomeForm.querySelector('#income').value;

    try {
        const response = await fetch(
            `/api/envelope/income`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ monthlyIncome })
            }
        );

        const responseMsg = await response.json();
        const msg = responseMsg['msg'];

        if (!response.ok) {
            alert(`Error: ${msg}!`);
            return;
        }

        localStorage.setItem('isDashboard', 'true');

        incomeForm.reset();

        document.querySelector('#homepage').style.display = 'none';
        document.querySelector('#dashboard').style.display = 'block';

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

    } catch (error) {
        alert('Something happened during the process. This is on our side, not yours. Please try again.');
    }
});


// Update envelopes
const updateForm = document.querySelector('#update-amount-form');

updateForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const searchResultsTitle = document.querySelector('#search-results-title').textContent.trim();
    const category = encodeURIComponent(searchResultsTitle.toLowerCase());
    
    const amount = updateForm.querySelector('#update-amount').value;

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

    } catch (error) {
        alert('Something happened while we were updating the envelope. This is on our side, not yours. Please try again.');
    }
});


const subtractForm = document.querySelector('#subtract-amount-form');

subtractForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const searchResultsTitle = document.querySelector('#search-results-title').textContent.trim();
    const category = encodeURIComponent(searchResultsTitle.toLowerCase());

    const subtractAmount = subtractForm.querySelector('#subtract-amount').value;

    try {
        const response = await fetch(
            `/api/envelope/${category}/update/subtract`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ subtractAmount })
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

    } catch (error) {
        alert('Something happened while we were updating the envelope. This is on our side, not yours. Please try again.');
    }
});


const transferForm = document.querySelector('#transfer-funds-form');

transferForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const categoryFrom = transferForm.querySelector('#category-from').value.trim();
    const categoryTo = transferForm.querySelector('#category-to').value.trim();
    const transferAmount = transferForm.querySelector('#transfer-amount').value;

    try {
        const response = await fetch(
            '/api/envelope/transfer',
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ categoryFrom, categoryTo, transferAmount })
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

    const searchResultsTitle = document.querySelector('#search-results-title').textContent.trim();
    const category = encodeURIComponent(searchResultsTitle.toLowerCase());

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

            window.location.reload();

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
                    body: JSON.stringify({ msg: `Deletion for "${searchResultsTitle}" envelope was cancelled` })
                }
            );
        } catch (error) {
            console.error(`Error adding message to update pool: ${error}`);
        }
    }
});


// Return to home
const returnToHomeButton = document.querySelector('#return-to-home-button');

returnToHomeButton.addEventListener('click', () => {
    // Inefficient code. try to find a way to refersh the search results page without it redirecting to the dashboard
    document.querySelector('#dashboard').style.display = 'block';
    document.querySelector('#dashboard-search-category').value = '';
    document.querySelector('#search-results-page').style.display = 'none';

    window.location.reload();
});


// Clear memory
const clearLocalStorageButton = document.querySelector('#clear-local-storage-button');

clearLocalStorageButton.addEventListener('click', () => {
    localStorage.clear();
    window.location.reload();
});
