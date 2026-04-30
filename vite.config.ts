import { defineConfig } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

const lucideCodeXmlAlias = {
  name: 'lucide-code-xml-alias',
  resolveId(source: string, importer?: string) {
    const normalizedImporter = importer?.replace(/\\/g, '/').split('?')[0];
    if (
      (source === './icons/code-xml.js' && normalizedImporter?.endsWith('/node_modules/lucide-react/dist/esm/lucide-react.js'))
      || (source === './code-xml.js' && normalizedImporter?.endsWith('/node_modules/lucide-react/dist/esm/icons/index.js'))
    ) {
      return path.resolve(__dirname, './node_modules/lucide-react/dist/esm/icons/code.js');
    }

    return null;
  },
};

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    lucideCodeXmlAlias,
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
