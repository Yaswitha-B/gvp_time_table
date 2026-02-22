import { useState } from "react";
import sampleRequest from "../sample_request.json";

const DAYS = ["Mon", "Tue", "Wed", "Thur", "Fri", "Sat"];
const SLOT_TIMES = ["8:40", "9:30", "10:20", "11:10", "12:00", "12:50", "1:40", "2:30", "3:20"];

const COURSE_COLORS = {
  "ESD LAB":      { bg: "#1a1a2e", accent: "#e94560", text: "#fff" },
  "CNS LAB":      { bg: "#16213e", accent: "#4cc9f0", text: "#e0e0e0" },
  "ML LAB":       { bg: "#0f2027", accent: "#2ecc71", text: "#e0e0e0" },
  "OOSE LAB":     { bg: "#1b1b2f", accent: "#a855f7", text: "#fff" },
  "ML":           { bg: "#f0f4ff", accent: "#4361ee", text: "#1a1a2e" },
  "CNS":          { bg: "#f0fff4", accent: "#2d6a4f", text: "#1a1a2e" },
  "OOSE":         { bg: "#fff0f6", accent: "#c9184a", text: "#1a1a2e" },
  "CC":           { bg: "#fffbe6", accent: "#e67e00", text: "#1a1a2e" },
  "STT":          { bg: "#f5f0ff", accent: "#7209b7", text: "#1a1a2e" },
  "DS":           { bg: "#e8f4f8", accent: "#0077b6", text: "#1a1a2e" },
  "BCT":          { bg: "#fef0e6", accent: "#d62828", text: "#1a1a2e" },
  "TERM_PROJECT": { bg: "#f5f5f5", accent: "#555",    text: "#1a1a2e" },
  "LIBRARY":      { bg: "#e8f5e9", accent: "#388e3c", text: "#1a1a2e" },
  "STUDY":        { bg: "#fce4ec", accent: "#e91e63", text: "#1a1a2e" },
  "VALUE_ADDED":  { bg: "#fff9e6", accent: "#f59e0b", text: "#1a1a2e" },
};

function SlotCell({ slot }) {
  if (slot === "LUNCH") {
    return (
      <div style={{
        background: "linear-gradient(135deg, #f59e0b, #d97706)",
        borderRadius: "7px", height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: "700", fontSize: "11px", color: "#fff"
      }}>
        🍽 LUNCH
      </div>
    );
  }

  if (!slot) {
    return (
      <div style={{
        background: "rgba(255,255,255,0.02)", borderRadius: "7px",
        height: "100%", border: "1px dashed rgba(255,255,255,0.08)"
      }} />
    );
  }

  const colors = COURSE_COLORS[slot.course] || { bg: "#f3f4f6", accent: "#6b7280", text: "#111" };

  return (
    <div style={{
      background: colors.bg, borderRadius: "7px", padding: "6px 8px", height: "100%",
      borderLeft: `3px solid ${colors.accent}`,
      display: "flex", flexDirection: "column", justifyContent: "space-between"
    }}>
      <div style={{ fontWeight: "700", fontSize: "10px", color: colors.text, lineHeight: 1.2, fontFamily: "'Courier New', monospace" }}>
        {slot.course}
      </div>
      {slot.teachers?.length > 0 && (
        <div style={{ fontSize: "8px", color: colors.accent, fontWeight: "600", marginTop: "2px" }}>
          {slot.teachers.join(", ")}
        </div>
      )}
      <div style={{ fontSize: "8px", color: colors.text, opacity: 0.55, fontStyle: "italic" }}>
        {slot.room}
      </div>
    </div>
  );
}

export default function TimetableViewer() {
  const [timetable, setTimetable] = useState(null);
  const [unplaced, setUnplaced] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setTimetable(null);
    try {
      const res = await fetch("http://localhost:3000/api/timetable/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sampleRequest)
      });
      const data = await res.json();
      if (!data.success) { setError("Server returned an error."); return; }
      setTimetable(data.timetable);
      setUnplaced(data.unplaced || []);
      setActiveSection(Object.keys(data.timetable)[0]);
    } catch (err) {
      setError("Could not connect to server. Make sure node app.js is running on port 3000.");
    } finally {
      setLoading(false);
    }
  };

  const sections = timetable ? Object.keys(timetable) : [];
  const sectionData = timetable && activeSection ? timetable[activeSection] : null;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)", padding: "32px 24px", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{ fontSize: "11px", letterSpacing: "4px", color: "#a78bfa", fontWeight: "600", marginBottom: "8px" }}>
          CSE DEPARTMENT · SEMESTER 6
        </div>
        <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#fff", margin: 0 }}>
          Class Timetable
        </h1>
        <div style={{ width: "60px", height: "3px", background: "linear-gradient(90deg,#a78bfa,#60a5fa)", margin: "12px auto 0", borderRadius: "2px" }} />
      </div>

      {/* Generate Button */}
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <button onClick={handleGenerate} disabled={loading} style={{
          padding: "13px 38px", borderRadius: "30px", border: "none",
          cursor: loading ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "14px",
          background: loading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg,#a78bfa,#60a5fa)",
          color: "#fff", boxShadow: loading ? "none" : "0 4px 20px rgba(167,139,250,0.5)",
          letterSpacing: "1px", transition: "all 0.2s"
        }}>
          {loading ? "⏳ Generating..." : "⚡ Generate Timetable"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", padding: "14px 24px", color: "#fca5a5", textAlign: "center", marginBottom: "20px", fontSize: "13px" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Unplaced Warning */}
      {unplaced.length > 0 && (
        <div style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "12px", padding: "10px 24px", color: "#fcd34d", textAlign: "center", marginBottom: "20px", fontSize: "13px" }}>
          ⚠️ Could not place: <strong>{unplaced.join(", ")}</strong>
        </div>
      )}

      {/* Section Tabs — generated dynamically from API response */}
      {timetable && (
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
          {sections.map(sec => (
            <button key={sec} onClick={() => setActiveSection(sec)} style={{
              padding: "9px 26px", borderRadius: "30px", border: "none", cursor: "pointer",
              fontWeight: "700", fontSize: "13px", transition: "all 0.2s",
              background: activeSection === sec ? "linear-gradient(135deg,#a78bfa,#60a5fa)" : "rgba(255,255,255,0.08)",
              color: activeSection === sec ? "#fff" : "rgba(255,255,255,0.5)",
              boxShadow: activeSection === sec ? "0 4px 16px rgba(167,139,250,0.4)" : "none",
              transform: activeSection === sec ? "translateY(-2px)" : "none"
            }}>
              Section {sec}
            </button>
          ))}
        </div>
      )}

      {/* Timetable Grid */}
      {sectionData && (
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", overflow: "auto", border: "1px solid rgba(255,255,255,0.08)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "860px" }}>
            <thead>
              <tr>
                <th style={{ padding: "14px 12px", fontSize: "11px", color: "rgba(255,255,255,0.3)", fontWeight: "600", letterSpacing: "2px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.08)", width: "65px" }}>
                  SLOT
                </th>
                {DAYS.map(day => (
                  <th key={day} style={{ padding: "14px 8px", fontSize: "11px", color: "#a78bfa", fontWeight: "700", letterSpacing: "2px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", borderLeft: "1px solid rgba(255,255,255,0.05)" }}>
                    {day.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SLOT_TIMES.map((time, slotIndex) => (
                <tr key={slotIndex} style={{ background: slotIndex % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                  <td style={{ padding: "6px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", verticalAlign: "middle" }}>
                    <div style={{ fontSize: "10px", color: "#60a5fa", fontWeight: "700" }}>{slotIndex + 1}</div>
                    <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)" }}>{time}</div>
                  </td>
                  {DAYS.map(day => (
                    <td key={day} style={{ padding: "5px", borderBottom: "1px solid rgba(255,255,255,0.05)", borderLeft: "1px solid rgba(255,255,255,0.05)", height: "68px", verticalAlign: "top" }}>
                      <SlotCell slot={sectionData[day]?.[slotIndex]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!timetable && !loading && !error && (
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", marginTop: "80px" }}>
          <div style={{ fontSize: "52px", marginBottom: "16px" }}>📅</div>
          <div style={{ fontSize: "16px" }}>Click Generate to create the timetable</div>
        </div>
      )}

      {/* Legend */}
      {timetable && (
        <div style={{ marginTop: "20px", display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
          {[
            { label: "Lab",      color: "#e94560" },
            { label: "Core",     color: "#4361ee" },
            { label: "Elective", color: "#7209b7" },
            { label: "Activity", color: "#388e3c" },
            { label: "Project",  color: "#555" },
            { label: "Lunch",    color: "#f59e0b" },
          ].map(item => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.06)", padding: "5px 14px", borderRadius: "20px" }}>
              <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: item.color }} />
              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.55)", fontWeight: "600" }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}