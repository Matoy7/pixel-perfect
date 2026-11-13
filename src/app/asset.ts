/** Resolve a file in /public against the deploy base (/pixel-perfect/ on GitHub Pages). */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;
