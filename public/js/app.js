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

    addBtn.addEventListener('click', openModal);
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

async function loadCards() {
    try {
        const response = await fetch(API_URL);
        const services = await response.json();

        cardsContainer.innerHTML = '';

        if (services.length === 0) {
            cardsContainer.innerHTML = '<p style="color: var(--text-dim); text-align: center; width: 100%; padding: 2rem;">No services added yet.</p>';
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
        <div class="card-url">${escapeHtml(service.url)}</div>
        <button class="card-delete" data-id="${service.id}" aria-label="Delete service">❌</button>
    `;

    // Prevent card click when deleting
    const deleteBtn = card.querySelector('.card-delete');
    deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        deleteService(service.id);
    });

    cardsContainer.appendChild(card);
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

function openModal() {
    modal.classList.add('active');
    document.getElementById('service-name').focus();
}

function closeModal() {
    modal.classList.remove('active');
    cardForm.reset();
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const service = {
        name: document.getElementById('service-name').value.trim(),
        category: document.getElementById('service-category').value.trim(),
        url: document.getElementById('service-url').value.trim(),
        icon: document.getElementById('service-icon').value.trim() || '📦'
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(service)
        });

        if (response.ok) {
            loadCards();
            closeModal();
        } else {
            alert('Failed to add service');
        }
    } catch (err) {
        console.error('Failed to add service:', err);
        alert('Failed to add service');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
