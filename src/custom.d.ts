// This file tells TypeScript how to handle file types it doesn't understand natively.
// Without this, TypeScript complains when you import a .css file.

declare module "*.css" {
  // The module exists, but we don't export anything from it
  // (CSS files are loaded for their side effects — styling the page)
  const content: Record<string, string>;
  export default content;
}
