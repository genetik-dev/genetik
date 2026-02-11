'use strict';

// Tailwind v4 via PostCSS so the docs app compiles Tailwind (including editor-react
// classes) as part of its dev/build—no separate editor-react CSS build.
module.exports = function tailwindPostcssPlugin() {
  return {
    name: 'tailwind-postcss',
    configurePostCss(postcssOptions) {
      postcssOptions.plugins = postcssOptions.plugins || [];
      postcssOptions.plugins.push(require('@tailwindcss/postcss'));
      return postcssOptions;
    },
  };
};
