import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "Safety Docs",
  tagline: "Confidential Treasury Layer for Gnosis Safe — powered by iExec Nox TEE",
  favicon: "img/favicon.ico",

  url: "https://safety-docs.vercel.app",
  baseUrl: "/",

  organizationName: "safety",
  projectName: "safety-docs",
  trailingSlash: false,

  onBrokenLinks: "throw",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },

  themes: ["@docusaurus/theme-mermaid"],

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          routeBasePath: "/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/safety-social.png",
    colorMode: {
      defaultMode: "dark",
      disableSwitch: false,
    },
    navbar: {
      title: "Safety",
      logo: {
        alt: "Safety Logo",
        src: "img/safety.png",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Documentation",
        },
        {
          href: "https://github.com/SamuelOluwayomi/Safety",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Documentation",
          items: [
            { label: "Introduction", to: "/" },
            { label: "Architecture", to: "/architecture/overview" },
            { label: "Smart Contracts", to: "/contracts/confidential-payout-module" },
          ],
        },
        {
          title: "Protocols",
          items: [
            { label: "iExec Nox", href: "https://docs.iex.ec/nox-protocol" },
            { label: "Gnosis Safe", href: "https://docs.safe.global" },
          ],
        },
        {
          title: "Project",
          items: [
            { label: "GitHub", href: "https://github.com/SamuelOluwayomi/Safety" },
            { label: "Live App", href: "https://safety-v1.vercel.app" },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Safety. Built for iExec WTF Hackathon.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["solidity", "bash", "json", "typescript"],
    },
    mermaid: {
      theme: { light: "neutral", dark: "dark" },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
