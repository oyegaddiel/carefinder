// This is a temporary placeholder for the individual hospital detail page.
// We'll build the full version in Step 5.
// For now, it prevents a 404 when clicking a hospital card.

export default function HospitalDetailPage() {
  return (
    <main
      style={{
        maxWidth: "800px",
        margin: "4rem auto",
        padding: "2rem",
        fontFamily: "sans-serif",
        textAlign: "center",
        color: "#4a4a4a",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
        Hospital Detail Page
      </h1>
      <p>This page is coming soon in Step 5.</p>
      <a
        href="/hospitals"
        style={{ color: "#14897f", marginTop: "1rem", display: "inline-block" }}
      >
        ← Back to hospitals
      </a>
    </main>
  );
}
