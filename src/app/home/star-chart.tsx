import { arabicNumber, text } from "@/lib/strings";

export type ChartColumn = { id: number; name: string; total: number };

// One color per column, like the rainbow poster in the classroom. Colors repeat if there are more than 7 reasons.
const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"];
/** Stars drawn in one cell; the rest are shown as "+N" so a big total never breaks the layout. */
const MAX_SHOWN = 12;

function Star({ color, delay }: { color: string; delay: number }) {
  return (
    <svg className="chart-star" viewBox="0 0 24 24" aria-hidden="true" style={{ animationDelay: `${delay}ms` }}>
      <path
        d="M12 2.2l2.9 6.1 6.7.9-4.9 4.6 1.2 6.6L12 17.2l-5.9 3.2 1.2-6.6L2.4 9.2l6.7-.9z"
        fill={color}
        stroke="rgba(0,0,0,0.25)"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path d="M12 5.6l1.5 3.4" stroke="rgba(255,255,255,0.7)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** "I can..." chart: one row for the kid, one column per reason, a colored star for every star earned. */
export default function StarChart({ columns }: { columns: ChartColumn[] }) {
  if (columns.length === 0) return null;

  return (
    <section className="chart" aria-label={text.home.chartTitle}>
      <div className="chart-banner">
        <span aria-hidden="true">★</span> {text.home.chartTitle} <span aria-hidden="true">★</span>
      </div>
      <div className="chart-scroll">
        <table className="chart-table">
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={c.id} scope="col" className="chart-head" style={{ "--c": COLORS[i % COLORS.length] } as React.CSSProperties}>
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {columns.map((c, i) => {
                const color = COLORS[i % COLORS.length];
                const shown = Math.min(c.total, MAX_SHOWN);
                const extra = c.total - shown;
                return (
                  <td key={c.id} className="chart-cell" style={{ "--c": color } as React.CSSProperties}>
                    <div className="chart-stars" role="img" aria-label={`${c.name}: ${arabicNumber(c.total)}`}>
                      {Array.from({ length: shown }, (_, k) => (
                        <Star key={k} color={color} delay={k * 60} />
                      ))}
                      {extra > 0 && <span className="chart-more">+{arabicNumber(extra)}</span>}
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
