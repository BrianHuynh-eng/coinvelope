// Display envelope(s)
document.addEventListener('DOMContentLoaded', () => {
    displayAllEnvelopes();
    displaySingleEnvelope();
});


const displayAllEnvelopes = async () => {
    try {
        const response = await fetch('/envelope/all');
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
            const response = await fetch(`/envelope/${category}`);
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
        showPage(envelopePage);
        envelopeCategoryMsg.textContent = envelope['category'];
        enterTableInfo(envelope);

        history.pushState(
            {page: 'envelope', category: envelope['category']},
            '',
            `envelope/${encodeURIComponent(envelope['category'])}`
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
                envelopeCategoryMsg.textContent = event.state.category;
                enterTableInfo(await fetchEnvelope(event.state.category));
            } else {
                showPage(mainPage);
            }
        } else {
            showPage(mainPage);
        }
    });

    const initializePage = async () => {
        const hash = window.location.hash;

        if (hash.startsWith('/envelope/')) {
            const category = decodeURIComponent(hash.replace('/envelope/', ''));
            navigateToEnvelope(await fetchEnvelope(category));
        } else {
            navigateToMain();
        }
    };

    initializePage();
};
