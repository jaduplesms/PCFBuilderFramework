import { createRoot } from 'react-dom/client';
import { App } from './App';
import { installXrmFormShim } from './shim/xrm-form';

installXrmFormShim();

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
