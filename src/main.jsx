import React from 'react';
import { createRoot } from 'react-dom/client';
import CampusPage from './campus/CampusPage';

// Standalone page. Served at "/" and (via SPA fallback) at "/college-campus".
createRoot(document.getElementById('root')).render(<CampusPage />);
