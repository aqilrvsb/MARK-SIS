/**
 * Formula Engine for Custom Columns
 *
 * Formulas reference column keys with {key} syntax:
 *   {spend} / {actions:lead}           → CPA
 *   {action_values:purchase} / {spend} → ROAS
 *   {spend} / 2                        → Half spend
 *   ({clicks} / {impressions}) * 100   → CTR %
 *
 * Supports: + - * / () and numbers
 */

export function evaluateFormula(
  formula: string,
  rowData: Record<string, unknown>
): number | null {
  try {
    // Replace {column_key} with actual values
    let expression = formula.replace(/\{([^}]+)\}/g, (_, key) => {
      const value = rowData[key.trim()];
      const num = parseFloat(String(value || 0));
      return isNaN(num) ? "0" : String(num);
    });

    // Sanitize: only allow numbers, operators, parentheses, dots, spaces
    expression = expression.replace(/[^0-9+\-*/().  ]/g, "");

    if (!expression.trim()) return null;

    // Evaluate using Function (safe since we sanitized input)
    const result = new Function(`return (${expression})`)();

    if (typeof result !== "number" || !isFinite(result)) return null;

    return Math.round(result * 100) / 100; // 2 decimal places
  } catch {
    return null;
  }
}

/**
 * Get all available column keys for formula autocomplete
 */
export function getFormulaHelp(): string {
  return `Formula syntax:
  {column_key} — reference a column value
  + - * / — math operators
  ( ) — grouping

Examples:
  {spend} / {actions:lead} — Cost per Lead
  {action_values:purchase} / {spend} — ROAS
  ({clicks} / {impressions}) * 100 — CTR %
  {spend} / 30 — Daily average (30 days)`;
}
