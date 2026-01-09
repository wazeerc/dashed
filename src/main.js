import './styles.css';

// API base URL
const API_URL = '/api/services';

// DOM elements
const cardsContainer = document.getElementById('cards-container');
const addBtn = document.getElementById('add-btn');
const modal = document.getElementById('modal');
const closeBtn = document.getElementById('close-btn');
const cancelBtn = document.getElementById('cancel-btn');
const cardForm = document.getElementById('card-form');
const dateEl = document.getElementById('date');
const timeEl = document.getElementById('time');

init();

function init() {
    loadCards();
    updateDateTime();

    setInterval(updateDateTime, 60000);

    addBtn.addEventListener('click', () => openModal('add'));
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    cardForm.addEventListener('submit', handleFormSubmit);
}

function updateDateTime() {
    const now = new Date();

    const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    dateEl.textContent = now.toLocaleDateString('en-US', dateOptions);

    timeEl.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

async function checkServiceStatus(url) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            cache: 'no-cache'
        });

        clearTimeout(timeoutId);

        return response && response.ok;
    } catch (error) {
        return false;
    }
}

async function loadCards() {
    try {
        const response = await fetch(API_URL);
        const services = await response.json();

        cardsContainer.innerHTML = '';

        if (services.length === 0) {
            cardsContainer.innerHTML = '<p style="color: var(--text-dim); font-size: 0.8rem; text-align: center; width: 100%; padding: 2rem;">No services added yet.</p>';
            return;
        }

        services.forEach(service => {
            createCard(service);
        });
    } catch (err) {
        console.error('Failed to load services:', err);
        cardsContainer.innerHTML = '<p style="color: var(--danger); text-align: center; width: 100%; padding: 2rem;">Failed to load services. Please refresh.</p>';
    }
}

function createCard(service) {
    const card = document.createElement('a');
    card.className = 'card';
    card.href = service.url;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';

    card.innerHTML = `
        <span class="card-icon">${service.icon || '📦'}</span>
        <div class="card-name">${escapeHtml(service.name)}</div>
        ${service.category ? `<div class="card-category">${escapeHtml(service.category)}</div>` : ''}
        <div class="card-url-wrapper">
            <div class="card-url">${escapeHtml(service.url)}</div>
            <span class="card-status checking" aria-label="Service status"></span>
        </div>
        <button class="card-delete" data-id="${service.id}" aria-label="Delete service">❌</button>
        <button class="card-edit" data-id="${service.id}" aria-label="Edit service">✏️</button>
    `;

    // Prevent card click when deleting
    const deleteBtn = card.querySelector('.card-delete');
    deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        deleteService(service.id);
    });

    // Edit button
    const editBtn = card.querySelector('.card-edit');
    editBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        editService(service.id);
    });

    cardsContainer.appendChild(card);

    const statusIndicator = card.querySelector('.card-status');
    checkServiceStatus(service.url)
        .then(isOnline => {
            // The card (and thus the status indicator) may have been removed
            // while the status check was in progress. Guard against that.
            if (!statusIndicator || !document.body.contains(statusIndicator)) {
                return;
            }

            statusIndicator.classList.remove('checking');
            if (isOnline) {
                statusIndicator.classList.add('online');
                statusIndicator.setAttribute('aria-label', 'Service is online');
            } else {
                statusIndicator.classList.add('offline');
                statusIndicator.setAttribute('aria-label', 'Service is offline');
            }
        })
        .catch(err => {
            console.error('Failed to check service status:', err);
            // If the indicator still exists, reflect the failure in the UI.
            if (!statusIndicator || !document.body.contains(statusIndicator)) {
                return;
            }
            statusIndicator.classList.remove('checking');
            statusIndicator.classList.add('offline');
            statusIndicator.setAttribute('aria-label', 'Service status could not be determined');
        });
}

async function editService(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (response.ok) {
            const service = await response.json();
            openModal('edit');
            document.getElementById('service-name').value = service.name;
            document.getElementById('service-category').value = service.category;
            document.getElementById('service-url').value = service.url;
            document.getElementById('service-icon').value = service.icon;
            // store id for update
            document.getElementById('service-id').value = service.id;
            // update UI to reflect edit mode
            const header = modal.querySelector('.modal-header h2');
            header.textContent = 'Edit Service';
            document.querySelector('.btn-submit').textContent = 'Save Changes';
        } else {
            alert('Failed to load service details for editing');
        }
    } catch (err) {
        console.error('Failed to load service details:', err);
        alert('Failed to load service details for editing');
    }
}

async function deleteService(id) {
    if (!confirm('Delete this service?')) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadCards();
        } else {
            alert('Failed to delete service');
        }
    } catch (err) {
        console.error('Failed to delete service:', err);
        alert('Failed to delete service');
    }
}

function openModal(mode = 'add') {
    modal.classList.add('active');

    cardForm.reset();
    document.getElementById('service-id').value = '';

    if (mode === 'add') {
        const header = modal.querySelector('.modal-header h2');
        header.textContent = 'Add Service';
        document.querySelector('.btn-submit').textContent = 'Add Service';
    } else if (mode === 'edit') {
        const header = modal.querySelector('.modal-header h2');
        header.textContent = 'Edit Service';
        document.querySelector('.btn-submit').textContent = 'Save Changes';
    }

    document.getElementById('service-name').focus();
}

function closeModal() {
    modal.classList.remove('active');
    cardForm.reset();
    // ensure we clear edit state
    document.getElementById('service-id').value = '';
    const header = modal.querySelector('.modal-header h2');
    header.textContent = 'Add Service';
    document.querySelector('.btn-submit').textContent = 'Add Service';
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const service = {
        name: document.getElementById('service-name').value.trim(),
        category: document.getElementById('service-category').value.trim(),
        url: document.getElementById('service-url').value.trim(),
        icon: document.getElementById('service-icon').value.trim() || '📦'
    };

    // determine if this is an edit
    const id = document.getElementById('service-id').value;
    const urlToUse = id ? `${API_URL}/${id}` : API_URL;
    const method = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(urlToUse, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(service)
        });

        if (response.ok) {
            loadCards();
            closeModal();
        } else {
            alert(id ? 'Failed to update service' : 'Failed to add service');
        }
    } catch (err) {
        console.error(id ? 'Failed to update service:' : 'Failed to add service:', err);
        alert(id ? 'Failed to update service' : 'Failed to add service');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
