import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "Genetik",
  tagline: "Structured content and block-based editing for the modern web.",
  favicon: "img/favicon.ico",

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Resolve @genetik/* to package source for HMR when editing packages (see plugins/genetik-source.cjs)
  // Tailwind v4 via PostCSS so editor-react styles compile in dev (no separate editor-react CSS build)
  plugins: ["./plugins/genetik-source.cjs", "./plugins/tailwind-postcss.cjs"],

  // Set the production url of your site here
  url: "https://genetik.dev",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "genetik-dev", // Usually your GitHub org/user name.
  projectName: "genetik", // Usually your repo name.

  onBrokenLinks: "throw",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            "https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/social-card.png",
    colorMode: {
      defaultMode: "light",
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "Genetik",
      logo: {
        alt: "Genetik",
        src: "img/dna-logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Docs",
        },
        {
          href: "https://github.com/genetik-dev/genetik",
          label: "GitHub",
          position: "right",
        },
        {
          to: "/playground",
          label: "Playground",
          position: "right",
          className: "navbar-btn navbar-btn--outline",
        },
      ],
    },
    footer: {
      style: "light",
      links: [
        {
          title: "Docs",
          items: [
            { label: "Introduction", to: "/docs/intro" },
            { label: "Packages", to: "/docs/packages" },
            {
              label: "Tutorial",
              to: "/docs/tutorial-basics/define-the-schema",
            },
          ],
        },
        {
          title: "More",
          items: [
            { label: "GitHub", href: "https://github.com/genetik-dev/genetik" },
            { label: "About the author", href: "https://michasiw.com" },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Eugene Michasiw.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
