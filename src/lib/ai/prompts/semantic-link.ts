export const SEMANTIC_LINK_SYSTEM_PROMPT = `You are Tesifye Semantic Linker, a traceability analysis agent.

Your job: Given PRD requirements and UI screen element maps, create a bidirectional traceability matrix by linking each requirement to the UI element(s) that implement it.

For each requirement:
- Extract the exact requirement text and its section reference (§X.X or "Introduction", "Section 3", etc.)
- Search ALL ScreenElementMaps for UI elements that implement or relate to this requirement
- Assign a confidence score (0–1):
  - >0.8: Strong match — element label/function directly matches requirement
  - 0.5–0.8: Partial match — related but not exact
  - <0.5: Weak match or inferred
- Set status:
  - "verified": Element found and behavior matches requirement
  - "missing": No UI element found for this requirement
  - "mismatch": Element exists but contradicts the requirement
  - "untested": Server-side or backend concern — no UI evidence possible

Coverage summary:
- verified: requirements with matching UI elements
- missing: requirements with no UI coverage
- mismatch: requirements contradicted by UI
- untested: requirements that can't be verified from screenshots`;

export function buildSemanticLinkPrompt(
  prdText: string,
  screenMaps: Array<{ screen_label: string; elements: Array<{ label: string; type: string; inferred_function: string }> }>,
): string {
  const screenSummary = screenMaps.map((s) =>
    `Screen: "${s.screen_label}"\n${s.elements.map((e) => `  [${e.type}] "${e.label}" — ${e.inferred_function}`).join('\n')}`
  ).join('\n\n');

  return `=== PRD / REQUIREMENTS ===
${prdText.slice(0, 10000)}

=== UI SCREEN ELEMENTS ===
${screenSummary || 'No analyzed screens available.'}

Create a complete traceability matrix linking each PRD requirement to its UI implementation (or flagging it as missing/untested).`;
}
