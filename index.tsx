import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
// @ts-ignore - virtual module provided by vite-plugin-pwa
import { registerSW } from 'virtual:pwa-register';

// GLOBAL ERROR HANDLER for White Screen debugging
// This runs before React mounts to catch import/syntax errors
window.onerror = function(message, source, lineno, colno, error) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; color: #333;">
        <h2 style="color: #e11d48;">Startup Error</h2>
        <p>The app failed to load.</p>
        <pre style="background: #f1f5f9; padding: 10px; border-radius: 8px; overflow: auto; color: #0f172a; font-size: 12px;">
${message}
at ${source}:${lineno}:${colno}
        </pre>
        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 8px;">Reload</button>
      </div>
    `;
  }
};

// Register Service Worker for PWA capabilities (offline, install)
registerSW({ immediate: true });

// Simple Error Boundary to catch React render crashes
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Application Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-800 p-6 text-center font-sans">
          <div className="bg-white p-6 rounded-2xl shadow-lg max-w-xs">
            <h1 className="text-xl font-bold mb-2 text-red-600">Something went wrong</h1>
            <p className="text-sm text-gray-500 mb-4">The app encountered an error while loading.</p>
            <div className="text-xs text-left bg-gray-100 p-2 rounded mb-4 overflow-auto max-h-32 text-gray-600 font-mono">
              {this.state.error?.toString() || 'Unknown Error'}
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-semibold shadow-md shadow-indigo-200"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
