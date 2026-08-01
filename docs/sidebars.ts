import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: "doc",
      id: "intro",
      label: "Introduction",
    },
    {
      type: "category",
      label: "Protocols",
      items: [
        "protocols/gnosis-safe",
        "protocols/iexec-nox",
      ],
    },
    {
      type: "category",
      label: "Architecture",
      items: [
        "architecture/overview",
        "architecture/payout-flow",
        "architecture/module-isolation",
        "architecture/privacy-model",
      ],
    },
    {
      type: "category",
      label: "Smart Contracts",
      items: [
        "contracts/confidential-payout-module",
        "contracts/abis",
        "contracts/deployment",
      ],
    },
    {
      type: "category",
      label: "Frontend",
      items: [
        "frontend/stack",
        "frontend/hooks",
        "frontend/api-routes",
        "frontend/module-cache",
      ],
    },
    {
      type: "category",
      label: "Guides",
      items: [
        "guides/quickstart",
        "guides/create-safe",
        "guides/deposit",
        "guides/propose-payout",
        "guides/finalize-payout",
        "guides/audit-acl",
      ],
    },
    {
      type: "category",
      label: "Troubleshooting",
      items: [
        "troubleshooting/common-errors",
        "troubleshooting/gas-issues",
        "troubleshooting/module-resolution",
        "troubleshooting/nox-revert",
      ],
    },
    {
      type: "category",
      label: "Reference",
      items: [
        "reference/environment-variables",
        "reference/deployed-addresses",
        "reference/error-codes",
      ],
    },
  ],
};

export default sidebars;
