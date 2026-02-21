export default function AboutPage() {
  return (
    <main style={{ padding: "40px", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Title */}
      <h1 style={{ fontSize: "36px", marginBottom: "12px", color: "#0f172a" }}>
        From individuals to a community that acts
      </h1>

      {/* Intro */}
      <p style={{ color: "#475569", fontSize: "18px", lineHeight: "1.6", maxWidth: "850px", marginBottom: "24px" }}>
        Vidzel is a purpose-driven collaboration platform that brings together
        organizations, students, volunteers, and mentors to work on real-world
        social impact projects in a structured and meaningful way.
      </p>

      {/* Image */}
      <div
        style={{
          position: "relative",
          borderRadius: "18px",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
          marginBottom: "40px",
        }}
      >
        <img
          src="/about-new.png"
          alt="Collaboration between students, volunteers, mentors, and organizations"
          style={{ width: "100%", display: "block" }}
        />

        {/* Blue overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(37, 99, 235, 0.35)",
          }}
        />
      </div>

      {/* Section: What Vidzel does */}
      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "22px", marginBottom: "12px", color: "#0f172a" }}>
          What Vidzel does
        </h2>
        <p style={{ color: "#475569", fontSize: "17px", lineHeight: "1.7", maxWidth: "900px" }}>
          Vidzel helps organizations clearly define their projects, tasks, and goals,
          while allowing contributors to join with well-defined roles. This structure
          ensures collaboration stays focused, organized, and results-driven.
        </p>
      </section>

      {/* Section: Who it's for */}
      <section style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "22px", marginBottom: "12px", color: "#0f172a" }}>
          Who Vidzel is for
        </h2>
        <ul style={{ color: "#475569", fontSize: "17px", lineHeight: "1.8", paddingLeft: "20px" }}>
          <li><strong>Organizations</strong> seeking structured support for social impact initiatives</li>
          <li><strong>Students</strong> looking for real-world experience and meaningful learning</li>
          <li><strong>Volunteers</strong> who want to contribute in a clear and organized way</li>
          <li><strong>Mentors</strong> offering guidance, expertise, and leadership</li>
        </ul>
      </section>

      {/* Section: Why it matters */}
      <section>
        <h2 style={{ fontSize: "22px", marginBottom: "12px", color: "#0f172a" }}>
          Why it matters
        </h2>
        <p style={{ color: "#475569", fontSize: "17px", lineHeight: "1.7", maxWidth: "900px" }}>
          Too many good ideas fail due to lack of structure and coordination.
          Vidzel bridges that gap by turning individual effort into collective
          action — helping teams move from ideas to measurable impact.
        </p>
      </section>
    </main>
  );
}
