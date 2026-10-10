import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";

import design from "./eslint/rules/design.mjs";

/**
 * The rules in AGENTS.md, enforced.
 *
 * `no-restricted-syntax` may only be configured once per file scope, so the
 * selector lists are composed here and attached to progressively narrower
 * scopes rather than re-declared per rule. Later config objects win, which is
 * how `src/components/ui/**` and the HTTP boundary relax exactly one ban each.
 */

// ── §2 Types are proven, never asserted ────────────────────────────────────
const typeSafety = [
  {
    selector: "TSNonNullExpression",
    message:
      "`!` is banned. Prove the value exists (`if (!x) throw new Error(...)`) or supply a real default. AGENTS.md §2.",
  },
  {
    selector: "TSAnyKeyword",
    message: "`any` is banned. Accept `unknown` at the boundary and parse it. AGENTS.md §2.",
  },
];

// `consistent-type-assertions` with `assertionStyle: "never"` skips `as const`
// on purpose, so that half of the ban is stated as a selector.
const asConst = [
  {
    selector: "TSAsExpression[typeAnnotation.typeName.name='const']",
    message:
      "`as const` is banned. Annotate the value with its type, or use `satisfies`, so the compiler checks it. AGENTS.md §2.",
  },
];

// ── §1 Nothing is assembled from primitives ───────────────────────────────
const NATIVE_CONTROL = [
  "input",
  "select",
  "textarea",
  "option",
  "optgroup",
  "datalist",
  "button",
  "progress",
  "meter",
  "dialog",
  "details",
  "summary",
  "fieldset",
  "output",
].join("|");

const nativeControls = [
  {
    selector: `JSXOpeningElement[name.name=/^(${NATIVE_CONTROL})$/]`,
    message:
      "Native controls are banned outside src/components/ui. Search src/components/ui, then `pnpm dlx shadcn@latest add <name>`. AGENTS.md §1.",
  },
];

// ── §4 Data flow ──────────────────────────────────────────────────────────
const dataFlow = [
  {
    selector: "CallExpression[callee.name='fetch']",
    message:
      "Bare fetch is banned here. Subscribe with `useQuery` to a feature's `queryOptions`; HTTP lives in src/app/api/** and src/lib/api/**. AGENTS.md §4.",
  },
  {
    selector: "CallExpression[callee.object.name='Promise'][callee.property.name='all']",
    message:
      "Use `Promise.allSettled` so one failed source costs one value, not the page. AGENTS.md §4.",
  },
  {
    selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
    message: "dangerouslySetInnerHTML is banned. Render structured data through components. AGENTS.md §1.",
  },
];

// ── §11 Language ──────────────────────────────────────────────────────────
const language = [
  {
    selector: "Literal[value=/\u2014/]",
    message: "No em dash in copy or code. Use a comma, colon, or two sentences. AGENTS.md §11.",
  },
  {
    selector: "JSXText[value=/\u2014/]",
    message: "No em dash in copy. Use a comma, colon, or two sentences. AGENTS.md §11.",
  },
  {
    selector: "TemplateElement[value.raw=/\u2014/]",
    message: "No em dash in copy or code. Use a comma, colon, or two sentences. AGENTS.md §11.",
  },
];

const rule = (selectors) => ({
  "no-restricted-syntax": ["error", ...selectors],
});

const sources = ["src/**/*.{ts,tsx,mts}"];
const primitives = ["src/components/ui/**/*.tsx"];
/** The only places HTTP is allowed: route handlers and the typed API client. */
const httpBoundary = ["src/app/api/**/*.ts", "src/lib/api/**/*.ts"];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "refs/**", ".agents/**", ".claude/**"]),

  // Type-aware checks: promises are handled, switches are exhaustive, nothing
  // unsafe leaks out of an `unknown`.
  {
    files: sources,
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-ignore": true,
          "ts-nocheck": true,
          "ts-expect-error": "allow-with-description",
          minimumDescriptionLength: 12,
        },
      ],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/switch-exhaustiveness-check": [
        "error",
        { considerDefaultExhaustiveForUnions: false, requireDefaultForNonUnion: true },
      ],
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      eqeqeq: ["error", "always"],
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },

  // Everything in the app, minus the two relaxations below.
  {
    files: sources,
    rules: rule([...typeSafety, ...asConst, ...nativeControls, ...dataFlow, ...language]),
  },

  // Primitives wrap Radix and must render the native element to do their job.
  // This is the only place the native-control ban is lifted.
  {
    files: primitives,
    rules: rule([...typeSafety, ...asConst, ...language]),
  },

  // The HTTP boundary is the only place allowed to fetch.
  {
    files: httpBoundary,
    rules: rule([...typeSafety, ...asConst, ...nativeControls, ...language]),
  },

  // §6 Styling: padding contains the gap.
  {
    files: sources,
    plugins: { design },
    rules: {
      "design/containment": "error",
    },
  },
]);
