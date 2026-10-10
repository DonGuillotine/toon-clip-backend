/**
 * The geometry rules, as ESLint rules.
 *
 * Two things in AGENTS.md §6 and design.md §3 and §5 are provable from a class
 * list, without a browser, and were previously only prose:
 *
 *   containment     a container's padding is never smaller than the gap
 *                   between its children, on the same axis.
 *   control-height  `rounded-full` is for control height only: single line and
 *                   at most 36px. A box that grows or scrolls is not that.
 *
 * Both read class strings and nothing else. `cn("p-2", "gap-3")`, a `cva`
 * variants object, and a JSX `className` are the same defect written three
 * ways, and they all arrive as string literals, so the rule is written against
 * literals rather than against JSX. That is also why it can judge a component
 * that composes its own classes.
 *
 * The rules are deliberately arithmetic, not stylistic. `p-2` beside `gap-3`
 * is 8px beside 12px; the report names both numbers, so the fix is a value and
 * not a taste judgement.
 */

// ── Tokens ─────────────────────────────────────────────────────────────────

/**
 * Split a class token into its variant prefix and its utility.
 *
 * The split is the last colon outside brackets, because variants are bracketed
 * (`[&_svg:not([class*='size-'])]:size-4`) and a colon inside a bracket is part
 * of the variant, not a separator.
 */
function splitToken(token) {
  let depth = 0;
  let split = -1;
  for (let i = 0; i < token.length; i += 1) {
    const char = token[i];
    if (char === "[" || char === "(") depth += 1;
    else if (char === "]" || char === ")") depth -= 1;
    else if (char === ":" && depth === 0) split = i;
  }
  const prefix = split >= 0 ? token.slice(0, split + 1) : "";
  const raw = token.slice(split + 1);
  const utility = raw.endsWith("!") ? raw.slice(0, -1) : raw;
  return { prefix, utility };
}

/**
 * A token that styles descendants is not this element's geometry. `*:p-1`
 * pads every child, `md:*:p-1` does it from one breakpoint, and
 * `[&>svg]:p-1` pads one child, so none of them says anything about the
 * element the gap belongs to.
 */
function targetsChildren(token) {
  return token.includes("[&") || /(?:^|:)\*+:(?!\*)/.test(token);
}

const UTILITY = /^(px|py|ps|pe|pt|pr|pb|p|gap-x|gap-y|gap|space-x|space-y)-(.+)$/;

/**
 * Tailwind's spacing scale, in px. `n` is a multiple of 0.25rem, and an
 * arbitrary value is taken at face value when it is a plain length. A value
 * this cannot read (`gap-[--spacing(var(--gap))]`) is left to the reader.
 */
function toPx(value) {
  const scale = /^(\d+(?:\.\d+)?)$/.exec(value);
  if (scale) return Number(scale[1]) * 4;
  const arbitrary = /^\[(\d+(?:\.\d+)?)(px|rem)\]$/.exec(value);
  if (!arbitrary) return null;
  return arbitrary[2] === "rem" ? Number(arbitrary[1]) * 16 : Number(arbitrary[1]);
}

const INLINE = "horizontal (inline)";
const BLOCK = "vertical (block)";

/**
 * Which axes a bare `gap` acts on. A flex row spaces its children horizontally
 * and a flex column vertically; only a grid or a wrapping flex spaces both. The
 * distinction matters because the other axis' padding is how the row gets its
 * height, not the frame around a group.
 */
function gapAxes(classList) {
  if (/\bflex-(col|col-reverse)\b/.test(classList)) return [BLOCK];
  if (/\bflex-wrap(-reverse)?\b/.test(classList)) return [INLINE, BLOCK];
  if (/\b(inline-)?grid\b/.test(classList)) return [INLINE, BLOCK];
  if (/\b(inline-)?flex\b/.test(classList)) return [INLINE];
  // No display in this string. It may be inherited from a component base
  // (`<Button className="gap-3">` is a row) or from a wrapper, and the axis
  // cannot be proven either way. Rows are both the dominant pattern here and
  // the one that is written explicitly when it is a column (`flex-col`), so
  // the undecidable case checks the inline axis and leaves the rest silent.
  return [INLINE];
}

/**
 * Every variant prefix in a class list starts a layer: the base layer plus one
 * layer per variant. A layer inherits the base and overrides what it names,
 * which is how the cascade reads (`gap-2 md:gap-4` is 8px, then 16px).
 *
 * Layers exist so `p-3 md:p-6` with `gap-2 md:gap-4` is not compared as the
 * smallest padding against the largest gap, which pairs the padding of one
 * breakpoint with the gap of another and invents a violation.
 */
function readLayers(classList) {
  const layers = new Map();
  const layerFor = (prefix) => {
    const layer = layers.get(prefix) ?? { pads: new Map(), gaps: new Map() };
    layers.set(prefix, layer);
    return layer;
  };

  for (const token of classList.split(/\s+/)) {
    if (!token || targetsChildren(token)) continue;
    const { prefix, utility } = splitToken(token);
    const match = UTILITY.exec(utility);
    if (!match) continue;
    const [, name, value] = match;
    const px = toPx(value);
    if (px === null) continue;

    const layer = layerFor(prefix);
    if (name === "gap" || name.startsWith("gap-") || name.startsWith("space-")) {
      layer.gaps.set(name, { px, token: utility });
    } else {
      layer.pads.set(name, { px, token: utility });
    }
  }

  return layers;
}

/** The smallest padding one layer sets on one axis, or null when it sets none. */
function paddingFor(pads, axis) {
  const keys =
    axis === INLINE ? ["p", "px", "ps", "pe", "pl", "pr"] : ["p", "py", "pt", "pb"];
  const found = [];
  for (const key of keys) {
    const value = pads.get(key);
    if (value) found.push(value);
  }
  if (found.length === 0) return null;
  return found.reduce((smallest, value) => (value.px < smallest.px ? value : smallest));
}

/** The gap one layer sets on one axis. `gap-x` beats `gap` on the inline axis. */
function gapFor(gaps, axis, axes) {
  const axisKeys =
    axis === INLINE ? ["gap-x", "space-x"] : ["gap-y", "space-y"];
  const found = [];
  for (const key of axisKeys) {
    const value = gaps.get(key);
    if (value) found.push(value);
  }
  const bare = gaps.get("gap");
  if (found.length === 0 && bare && axes.includes(axis)) found.push(bare);
  if (found.length === 0) return null;
  return found.reduce((smallest, value) => (value.px < smallest.px ? value : smallest));
}

function containmentViolations(classList) {
  const layers = readLayers(classList);
  if (layers.size === 0) return [];
  const base = layers.get("") ?? { pads: new Map(), gaps: new Map() };
  const axes = gapAxes(classList);
  const violations = [];

  for (const [, layer] of layers) {
    const pads = new Map([...base.pads, ...layer.pads]);
    const gaps = new Map([...base.gaps, ...layer.gaps]);
    for (const axis of [INLINE, BLOCK]) {
      const padding = paddingFor(pads, axis);
      const gap = gapFor(gaps, axis, axes);
      if (!padding || !gap) continue;
      if (padding.px < gap.px) violations.push({ axis, padding, gap });
    }
  }

  // The same defect seen in three layers is one defect.
  const seen = new Set();
  return violations.filter((violation) => {
    const key = `${violation.axis}:${violation.padding.token}:${violation.gap.token}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const containment = {
  meta: {
    type: "problem",
    docs: {
      description:
        "A container's padding is never smaller than the gap between its children",
    },
    schema: [],
    messages: {
      containment:
        "`{{padding}}` ({{paddingPx}}px) is smaller than `{{gap}}` ({{gapPx}}px) on the {{axis}} axis. The padding around a group is never smaller than the gap inside it (p >= g), or the children read as spilling past their own frame. AGENTS.md §6.",
    },
  },
  create(context) {
    const check = (node, classList) => {
      for (const violation of containmentViolations(classList)) {
        context.report({
          node,
          messageId: "containment",
          data: {
            padding: violation.padding.token,
            paddingPx: String(violation.padding.px),
            gap: violation.gap.token,
            gapPx: String(violation.gap.px),
            axis: violation.axis,
          },
        });
      }
    };

    return {
      Literal(node) {
        if (typeof node.value === "string") check(node, node.value);
      },
      TemplateLiteral(node) {
        if (node.expressions.length > 0) return;
        const quasi = node.quasis[0];
        if (!quasi) return;
        check(node, quasi.value.cooked ?? quasi.value.raw);
      },
    };
  },
};

// ── control-height ─────────────────────────────────────────────────────────

/**
 * Proof that an element is not a single line at control height. Each entry is
 * a token that only a growing box, a scrolling region, or a box taller than
 * 36px can carry.
 */
const NOT_ONE_LINE = [
  {
    test: (utility) => utility === "field-sizing-content",
    reason: "a field that sizes to its content grows past one line",
  },
  {
    test: (utility) => /^overflow(-y)?-(auto|scroll)$/.test(utility),
    reason: "a scrolling region holds rows, not a line",
  },
  {
    test: (utility) => {
      const match = /^min-h-(.+)$/.exec(utility);
      if (!match) return false;
      const px = toPx(match[1]);
      return px !== null && px > 36;
    },
    reason: "its minimum height is past control height",
  },
];

function controlHeightViolation(classList) {
  let pill = null;
  let marker = null;

  for (const token of classList.split(/\s+/)) {
    if (!token || targetsChildren(token)) continue;
    const { utility } = splitToken(token);
    if (!pill && utility === "rounded-full") pill = utility;
    if (marker) continue;
    for (const entry of NOT_ONE_LINE) {
      if (entry.test(utility)) {
        marker = { token: utility, reason: entry.reason };
        break;
      }
    }
  }

  return pill && marker ? marker : null;
}

export const controlHeight = {
  meta: {
    type: "problem",
    docs: {
      description: "rounded-full is for control height: single line, at most 36px",
    },
    schema: [],
    messages: {
      "control-height":
        "`rounded-full` on `{{marker}}`: {{reason}}. A pill is a single line at control height; give this element a radius from the scale instead (design.md §3).",
    },
  },
  create(context) {
    const check = (node, classList) => {
      const violation = controlHeightViolation(classList);
      if (!violation) return;
      context.report({
        node,
        messageId: "control-height",
        data: { marker: violation.token, reason: violation.reason },
      });
    };

    return {
      Literal(node) {
        if (typeof node.value === "string") check(node, node.value);
      },
      TemplateLiteral(node) {
        if (node.expressions.length > 0) return;
        const quasi = node.quasis[0];
        if (!quasi) return;
        check(node, quasi.value.cooked ?? quasi.value.raw);
      },
    };
  },
};

const design = {
  rules: { containment, "control-height": controlHeight },
};

export default design;