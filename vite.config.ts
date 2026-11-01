import { defineConfig } from 'vite';

export default defineConfig(({ command, isPreview }) => ({
  // Build and preview share the GitHub project path; dev stays at root.
  base: command === 'build' || isPreview ? '/SharrowkinJam/' : '/',
}));
