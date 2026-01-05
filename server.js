const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'services.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

function readServices() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading services:', err);
        return [];
    }
}

function writeServices(services) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(services, null, 2));
        return true;
    } catch (err) {
        console.error('Error writing services:', err);
        return false;
    }
}

// API Routes

// GET all services
app.get('/api/services', (req, res) => {
    const services = readServices();
    res.json(services);
});

// POST new service
app.post('/api/services', (req, res) => {
    const { name, category, url, icon } = req.body;

    if (!name || !url) {
        return res.status(400).json({ error: 'Name and URL are required' });
    }

    const services = readServices();
    const newService = {
        id: Date.now(),
        name,
        category: category || '',
        url,
        icon: icon || '📦'
    };

    services.push(newService);

    if (writeServices(services)) {
        res.status(201).json(newService);
    } else {
        res.status(500).json({ error: 'Failed to save service' });
    }
});

// GET single service
app.get('/api/services/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const services = readServices();
    const service = services.find(s => s.id === id);

    if (!service) {
        return res.status(404).json({ error: 'Service not found' });
    }

    res.json(service);
});

// PUT update service
app.put('/api/services/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { name, category, url, icon } = req.body;

    if (!name || !url) {
        return res.status(400).json({ error: 'Name and URL are required' });
    }

    const services = readServices();
    const idx = services.findIndex(s => s.id === id);

    if (idx === -1) {
        return res.status(404).json({ error: 'Service not found' });
    }

    services[idx] = {
        ...services[idx],
        name,
        category: category || '',
        url,
        icon: icon || '📦'
    };

    if (writeServices(services)) {
        res.json(services[idx]);
    } else {
        res.status(500).json({ error: 'Failed to update service' });
    }
});

// DELETE service
app.delete('/api/services/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const services = readServices();
    const filtered = services.filter(s => s.id !== id);

    if (filtered.length === services.length) {
        return res.status(404).json({ error: 'Service not found' });
    }

    if (writeServices(filtered)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Failed to delete service' });
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dashed server running on port ${PORT}`);
});
