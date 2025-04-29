/* src/App.jsx */
import { useEffect, useState } from "react";
import "./App.css";

export default function App() {
  const [runs, setRuns] = useState(null);

  /* fetch all prompt documents */
  useEffect(() => {
    fetch("http://localhost:3000/api/prompts")
      .then((r) => r.json())
      .then(setRuns)
      .catch((e) => console.error(e));
  }, []);

  if (!runs) return <div className="loader">Loading…</div>;

  return (
    <main className="page">
      <h1>Competitor Intelligence Runs</h1>

      {runs.map((doc) => (
        <details className="card" key={doc._id}>
          <summary>
            <span className="client">{doc.client_company}</span>
            <span className="arrow">→</span>
            <span className="target">{doc.target_company}</span>
            <span className="when">
              {new Date(doc.createdAt).toLocaleString()}
            </span>
          </summary>

          <h2>Verified Competitors at Target</h2>
          <InsightTable insights={doc.insights} />

          <p className="summary">
            <strong>Summary&nbsp;</strong>
            {doc.client_company} faces {doc.insights?.length ?? 0} confirmed
            rivals already embedded at {doc.target_company}. Review services
            above to design displacement or co-sell plays.
          </p>
        </details>
      ))}
    </main>
  );
}

/* ---------- table ---------- */
function InsightTable({ insights = [] }) {
  if (!insights.length) return <p>No insights stored.</p>;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Company</th>
            <th>Service / Capacity</th>
            <th>Proof</th>
          </tr>
        </thead>
        <tbody>
          {insights.map((row, i) => (
            <tr key={i}>
              <td className="num">{i + 1}</td>
              <td>{row.company_name}</td>
              <td>{row.service}</td>
              <td>
                {row.citations?.map((url, idx) => (
                  <span key={idx} style={{ whiteSpace: "nowrap" }}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "var(--link)" }}
                    >
                      link&nbsp;{idx + 1}
                    </a>
                    {idx < row.citations.length - 1 && <span>,&nbsp;</span>}
                  </span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
