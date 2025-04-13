
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Ensure the root element exists and render the App component
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(<App />);
