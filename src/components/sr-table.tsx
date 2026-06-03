/**
 * A visually-hidden data table that mirrors a chart's numbers for screen
 * readers. The chart's visual container carries `role="img"` + an aria-label
 * (so the SVG internals are skipped), and this table — a sibling, not a child —
 * exposes the underlying values as real tabular data. First cell of each row is
 * a row header.
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
    <table className="sr-only">
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
  );
}
