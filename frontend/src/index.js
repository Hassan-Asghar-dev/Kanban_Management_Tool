// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter for routing

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <BrowserRouter> {/* Wrap your entire app with BrowserRouter */}
    <App />
  </BrowserRouter>
);

// Optional: Measure performance (for example, send metrics to an analytics endpoint)
reportWebVitals();
