/**
 * A visually-hidden data table that mirrors a chart's numbers for screen
 * readers. The chart's visual container carries `role="img"` + an aria-label
 * (so the SVG internals are skipped), and this table — a sibling, not a child —
 * exposes the underlying values as real tabular data. First cell of each row is
 * a row header.
 *
 * The `sr-only` wrapper is a <div>, not the <table> itself: an auto-layout
 * table ignores the `width:1px` of `sr-only` and expands to its intrinsic
 * content width, causing horizontal page overflow on phones. A block wrapper
 * clips it correctly.
 */
export function SrOnlyTable({
  caption,
  head,
  rows,
}: {
  caption: string;
  head: string[];
  rows: Array<Array<string | number>>;
}) {
  return (
    <div className="sr-only">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={h} scope={i === 0 ? undefined : "col"}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={String(row[0])}>
              {row.map((cell, j) =>
                j === 0 ? (
                  <th key={j} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={j}>{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
