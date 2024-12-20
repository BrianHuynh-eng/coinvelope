document.addEventListener('DOMContentLoaded', () => {
    handlePaths();
    observeHistoryChanges();
    displayAllEnvelopes();
    displayBudgetingPower();
    displayTotalBalance();
    displayUpdatesHistory();
    displayRandomEnvelopeSuggestion();
});


const handlePaths = async () => {
    const path = window.location.pathname;

    if (path === '/') {
        if (sessionStorage.getItem('hasIncomeInputted') === 'true') {
            document.querySelector('#homepage').style.display = 'none';
            document.querySelector('#dashboard').style.display = 'block';
            document.querySelector('#search-results-page').style.display = 'none';
            document.querySelector('#pattern-container').style.display = 'none';

            window.history.replaceState('', '', '/dashboard');

            return;
        }

        document.querySelector('#homepage').style.display = 'block';
        document.querySelector('#dashboard').style.display = 'none';
        document.querySelector('#search-results-page').style.display = 'none';
        document.querySelector('#pattern-container').style.display = 'block';

        globalThis.scrollTo(0, 0);

    } else if (path === '/dashboard') {
        if (sessionStorage.getItem('hasIncomeInputted') !== 'true') {
            document.querySelector('#homepage').style.display = 'block';
            document.querySelector('#dashboard').style.display = 'none';
            document.querySelector('#search-results-page').style.display = 'none';

            window.history.replaceState('', '', '/');

            return;
        }

        document.querySelector('#homepage').style.display = 'none';
        document.querySelector('#dashboard').style.display = 'block';
        document.querySelector('#search-results-page').style.display = 'none';
        document.querySelector('#pattern-container').style.display = 'none';

        globalThis.scrollTo(0, 0);
       
    } else if (path.startsWith('/envelope-')) {
        if (sessionStorage.getItem('hasIncomeInputted') !== 'true') {
            document.querySelector('#homepage').style.display = 'block';
            document.querySelector('#dashboard').style.display = 'none';
            document.querySelector('#search-results-page').style.display = 'none';
            
            window.history.replaceState('', '', '/');

            return;
        }

        document.querySelector('#homepage').style.display = 'none';
        document.querySelector('#dashboard').style.display = 'none';
        document.querySelector('#search-results-page').style.display = 'block';
        document.querySelector('#pattern-container').style.display = 'none';

        const searchedCategory = decodeURIComponent(path.split('/envelope-')[1]).trim();
        const category = encodeURIComponent(searchedCategory.toLowerCase());

        try {
            const response = await fetch(`/api/envelope/${category}`);
            const responseEnvelope = await response.json();

            document.querySelector('#dashboard-search-category').value = searchedCategory;
            document.querySelector('#search-results-search-category').value = searchedCategory;

            const searchResultsTitle = document.querySelector('#search-results-title');

            if (!response.ok) {
                searchResultsTitle.textContent = `${responseEnvelope['msg']}! Your search '${searchedCategory}' has no matches. Perhaps you made a typo?`;
                searchResultsTitle.style.fontSize = '7vw';
                searchResultsTitle.style.textAlign = 'center';

                document.querySelectorAll('#search-results-page .container').forEach((container) => {
                    container.style.display = 'none';
                });
                document.querySelector('.danger-zone').style.display = 'none';

                return;
            }

            const envelope = responseEnvelope['envelope'];

            searchResultsTitle.textContent = envelope['category'];
            searchResultsTitle.style.fontSize = '5vw';
            searchResultsTitle.style.textAlign = 'center';
            searchResultsTitle.style.marginTop = '-2vw';

            document.querySelector('#current-balance').textContent = `$${envelope['amount']}`;
            document.querySelectorAll('#search-results-page .container').forEach((container) => {
                container.style.display = 'block';
            });
            document.querySelector('.danger-zone').style.display = 'block';

            globalThis.scrollTo(0, 0);

        } catch (error) {
            alert('Something happened while we were searching for the envelope. This is on our side, not yours. Please try again.');
            window.history.replaceState('', '', '/dashboard');
        }

    } else {
        document.querySelector('#homepage').style.display = 'none';
        document.querySelector('#dashboard').style.display = 'none';
        document.querySelector('#search-results-page').style.display = 'none';
        document.querySelector('#pattern-container').style.display = 'none';

        const html = document.querySelector('html');

        const h1 = document.createElement('h1');
        h1.textContent = '?';
        h1.style.fontSize = '35vw';
        h1.style.margin = '0';
        h1.style.padding = '0';
        h1.style.textAlign = 'center';

        html.prepend(h1);
    }
};


const observeHistoryChanges = async () => {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
        originalPushState.apply(history, args);
        handlePaths();
    };

    history.replaceState = (...args) => {
        originalReplaceState.apply(history, args);
        handlePaths();
    };

    window.addEventListener('popstate', handlePaths);
};


// Read all envelopes
const displayAllEnvelopes = async () => {
    try {
        const response = await fetch('/api/envelope/all');
        const responseEnvelopes = await response.json();

        if (!response.ok) {
            const tableContainer = document.querySelector('#envelopes-table-container');

            const p = document.createElement('p');
            p.textContent = `${responseEnvelopes['msg']}! Create an envelope and start budgeting!`;
            p.style.textAlign = 'center';
            p.style.margin = '0';
            p.style.marginTop = '2.25vw';
            p.style.fontSize = '3.25vw';
            p.style.fontWeight = 'bold';
            p.style.padding = '0vw 1.5vw';

            tableContainer.appendChild(p);
            return;
        }

        const envelopes = responseEnvelopes['envelopes'];

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
const displayUpdatesHistory = async () => {
    try {
        const response = await fetch('/api/updates/all');
        const responseUpdatesHistory = await response.json();

        const updatesHistoryDiv = document.querySelector('#updates-history');
        updatesHistoryDiv.innerHTML = '';

        if (!response.ok) {
            const p = document.createElement('p');
            p.textContent = responseUpdatesHistory['msg'];
            p.style.margin = '0';
            p.style.marginTop = '2.25vw';
            p.style.fontSize = '5vw';
            p.style.textAlign = 'center';
            p.style.fontWeight = 'bold';

            updatesHistoryDiv.appendChild(p);

            return;
        }

        const updatesHistory = responseUpdatesHistory['updatesHistory'];

        for (let i=updatesHistory.length - 1; i>=0; i--) {
            const p = document.createElement('p');
            p.textContent = updatesHistory[i];
            updatesHistoryDiv.appendChild(p);
        }

    } catch (error) {
        alert('Something happened while we were loading the updates history. This is on our side, not yours. Please try again.');
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
            alert(`${msg}!`);
        }

        addToUpdatesHistory(msg);

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
            alert(`${msg}!`);
            return;
        }

        addToUpdatesHistory(msg);

        incomeForm.reset();

        sessionStorage.setItem('hasIncomeInputted', 'true');
        window.history.replaceState('', '', '/dashboard');
        globalThis.scrollTo(0, 0);

        setTimeout(() => {
            window.location.reload();
        }, 750);

    } catch (error) {
        alert('Something happened during the process. This is on our side, not yours. Please try again.');
    }
});


// Transfer money between envelopes
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
            alert(`${msg}!`);
        }

        addToUpdatesHistory(msg);

        transferForm.reset();
        window.location.reload();

    } catch (error) {
        alert('Something happened while we were updating the envelope. This is on our side, not yours. Please try again.');
    }
});


// Update monthly income
const updateIncomeForm = document.querySelector('#update-income-form');

updateIncomeForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const monthlyIncome = updateIncomeForm.querySelector('#update-income').value;

    try {
        const response = await fetch(
            'api/envelope/update-income',
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ monthlyIncome })
            }
        );

        const responseMsg = await response.json();
        const msg = responseMsg['msg'];

        if (!response.ok) {
            alert(`${msg}!`);
        }

        addToUpdatesHistory(msg);

        updateIncomeForm.reset();
        window.location.reload();

    } catch (error) {
        alert('Something happened while we were updating the envelope. This is on our side, not yours. Please try again.');
    }
});


// Delete all envelopes
const deleteAllEnvelopesBtn = document.querySelector('#delete-all-envelopes-btn');

deleteAllEnvelopesBtn.addEventListener('click', async () => {
    const confirmDeletion = confirm('Are you sure you want to delete all envelopes? You will not be able to recover them.');

    if (confirmDeletion) {
        try {
            const response = await fetch(
                '/api/envelope/delete-all-envelopes',
                {method: 'DELETE'}
            )

            const responseMsg = await response.json();
            const msg = responseMsg['msg'];

            if (!response.ok) {
                alert(`${msg}!`);
            }

            addToUpdatesHistory(msg);
            
            window.location.reload();

        } catch (error) {
            alert('Something happened while we were deleting the envelopes. This is on our side, not yours. Please try again.');
        }

    } else {
        addToUpdatesHistory('Deletion for all envelopes was cancelled');
    }
});


// Delete everything
const deleteEverythingBtn = document.querySelector('#delete-everything-btn');

deleteEverythingBtn.addEventListener('click', async () => {
    const confirmDeletion = confirm('Are you sure you want to delete everything? All data will be lost.');

    if (confirmDeletion) {
        const reconfirmDeletion = confirm('Last chance! Are you sure you want to delete everything? This action cannot be undone.');

        if (reconfirmDeletion) {
            try {
                await fetch(
                    '/api/envelope/delete-everything',
                    {method: 'DELETE'}
                );

            } catch (error) {
                alert('Something happened while we were deleting everything. This is on our side, not yours. Please try again.');
            }

            try {
                await fetch(
                    '/api/updates/delete-all',
                    {method: 'DELETE'}
                );
                
            } catch (error) {
                console.error(`Error adding message to update pool: ${error}`);
            }

            sessionStorage.clear();
            window.history.replaceState('', '', '/');

        } else {
            addToUpdatesHistory('Deletion for all data was cancelled');
        }

    } else {
        addToUpdatesHistory('Deletion for all data was cancelled');
    }
});


// Read single envelope
const dashboardSearchForm = document.querySelector('#dashboard-search-form');
const searchResultsSearchForm = document.querySelector('#search-results-search-form');

[dashboardSearchForm, searchResultsSearchForm].forEach((form) => {
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const searchedCategory = form.querySelector("input[name='category']").value.trim();
        const category = encodeURIComponent(searchedCategory.toLowerCase());

        if (searchedCategory === '') {
            return;
        }

        try {
            const response = await fetch(`/api/envelope/${category}`);
            const responseEnvelope = await response.json();

            window.history.pushState('', '', `/envelope-${category}`);

            document.querySelector('#dashboard-search-category').value = searchedCategory;
            document.querySelector('#search-results-search-category').value = searchedCategory;

            const searchResultsTitle = document.querySelector('#search-results-title');

            if (!response.ok) {
                searchResultsTitle.textContent = `${responseEnvelope['msg']}! Your search '${searchedCategory}' has no matches. Perhaps you made a typo?`;
                searchResultsTitle.style.fontSize = '7vw';
                searchResultsTitle.style.textAlign = 'center';

                document.querySelectorAll('#search-results-page .container').forEach((container) => {
                    container.style.display = 'none';
                });
                document.querySelector('.danger-zone').style.display = 'none';

                return;
            }

            const envelope = responseEnvelope['envelope'];

            searchResultsTitle.textContent = envelope['category'];
            searchResultsTitle.style.fontSize = '5vw';
            searchResultsTitle.style.textAlign = 'center';
            searchResultsTitle.style.marginTop = '-2vw';

            document.querySelector('#current-balance').textContent = `$${envelope['amount']}`;
            document.querySelectorAll('#search-results-page .container').forEach((container) => {
                container.style.display = 'block';
            });
            document.querySelector('.danger-zone').style.display = 'block';

        } catch (error) {
            alert('Something happened while we were searching for the envelope. This is on our side, not yours. Please try again.');
        }
    })
});


// Update budget amount for single envelope
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
            alert(`${msg}!`);
        }

        addToUpdatesHistory(msg);

        updateForm.reset();
        window.location.reload();

    } catch (error) {
        alert('Something happened while we were updating the envelope. This is on our side, not yours. Please try again.');
    }
});


// Subtract budget amount for single envelope
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
            alert(`${msg}!`);
        }

        addToUpdatesHistory(msg);

        subtractForm.reset();
        window.location.reload();

    } catch (error) {
        alert('Something happened while we were updating the envelope. This is on our side, not yours. Please try again.');
    }
});


// Delete single envelope
const deleteEnvelopeBtn = document.querySelector('#delete-envelope-btn');

deleteEnvelopeBtn.addEventListener('click', async () => {
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

            addToUpdatesHistory(msg);

            returnToHomeBtn.click();

        } catch (error) {
            alert('Something happened while we were deleting the envelope. This is on our side, not yours. Please try again.');
        }

    } else {
        addToUpdatesHistory(`Deletion for "${searchResultsTitle}" envelope was cancelled`);
    }
});


// Return to home
const returnToHomeBtn = document.querySelector('#return-to-home-btn');

returnToHomeBtn.addEventListener('click', () => {
    window.history.replaceState('', '', '/dashboard');
    globalThis.scrollTo(0, 0);

    setTimeout(() => {
        window.location.reload();
    }, 750);
});


// Helper function(s)
const addToUpdatesHistory = async (msg) => {
    try {
        await fetch(
            '/api/updates/new',
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
};
