module.exports = {
  plugins: {
    'postcss-import': {},
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production'
      ? {
          cssnano: {
            preset: [
              'advanced',
              {
                discardComments: { removeAll: true },
                reduceInitial: false,
                zindex: false,
                convertValues: { length: false },
              },
            ],
          },
        }
      : {}),
  },
};
