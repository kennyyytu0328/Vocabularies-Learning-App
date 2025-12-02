import { db } from './db.js';
import { ui } from './ui.js';

async function initApp() {
    try {
        await db.init();
        await ui.init();
    } catch (e) {
        console.error('Initialization failed:', e);
        document.body.innerHTML = '<h1>Failed to load application. Please check console.</h1>';
    }
}

document.addEventListener('DOMContentLoaded', initApp);
