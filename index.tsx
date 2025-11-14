
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './src/index.css';
import '@fontsource/zalando-sans-semiexpanded/300.css';
import '@fontsource/zalando-sans-semiexpanded/400.css';
import '@fontsource/zalando-sans-semiexpanded/500.css';
import '@fontsource/zalando-sans-semiexpanded/600.css';
import '@fontsource/zalando-sans-semiexpanded/700.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
