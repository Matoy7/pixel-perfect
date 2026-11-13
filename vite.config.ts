import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Cache-busting for files in /public (they keep fixed names, so browsers and
 * the GitHub Pages CDN would keep serving old copies after an update).
 * Every file under public/assets gets a short content hash, which asset()
 * appends as ?v=<hash>: a changed file = a new URL, an unchanged file stays cached.
 */
function assetHashes(): Plugin {
  const root = join(__dirname, 'public');
  const hashes: Record<string, string> = {};
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else hashes[relative(root, full).split('\\').join('/')] = createHash('md5').update(readFileSync(full)).digest('hex').slice(0, 8);
    }
  };
  walk(join(root, 'assets'));
  return {
    name: 'asset-hashes',
    config: () => ({ define: { __ASSET_HASHES__: JSON.stringify(hashes) } }),
    // the preload links in index.html get the same versioned URLs
    transformIndexHtml: (html) =>
      html.replace(/(href|src)="\.\/(assets\/[^"?]+)"/g, (m, attr, path) =>
        hashes[path] ? `${attr}="./${path}?v=${hashes[path]}"` : m,
      ),
  };
}

// Served from https://matoy7.github.io/pixel-perfect/
export default defineConfig({
  base: '/pixel-perfect/',
  plugins: [react(), assetHashes()],
  build: {
    rollupOptions: {
      // the game + the admin analytics dashboard (/pixel-perfect/admin.html)
      input: { main: resolve(__dirname, 'index.html'), admin: resolve(__dirname, 'admin.html') },
    },
  },
});
