// postcss.config.mjs
export default {
  plugins: {
    'tailwindcss/nesting': {},  // Important for v4
    tailwindcss: {},            // Note: Direct usage is correct in v4
    autoprefixer: {},
  }
}