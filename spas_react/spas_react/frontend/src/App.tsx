import { useEffect, useState } from 'react'
import { getStudents, getAnalytics, updateMarks } from './api'
import type { Student, Analytics } from './types'

type View = 'dashboard' | 'students'

function statusColor(status: string) {
  if (status === 'PASS') return '#3DD68C'
  if (status === 'AT RISK') return '#F0A500'
  return '#E5484D'
}

export default function App() {
  const [view, setView] = useState<View>('dashboard')
  const [students, setStudents] = useState<Student[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [selected, setSelected] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadAll() {
    try {
      setLoading(true)
      const [s, a] = await Promise.all([getStudents(), getAnalytics()])
      setStudents(s)
      setAnalytics(a)
      setError(null)
    } catch (e) {
      setError('Could not reach the backend. Is app.py running on port 5000?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  return (
    <div className="app">
      <header className="topbar">
        <h1>Student Performance Analysis</h1>
        <nav>
          <button
            className={view === 'dashboard' ? 'active' : ''}
            onClick={() => setView('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={view === 'students' ? 'active' : ''}
            onClick={() => setView('students')}
          >
            Students
          </button>
        </nav>
      </header>

      <main>
        {loading && <p className="hint">Loading…</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && view === 'dashboard' && analytics && (
          <Dashboard analytics={analytics} />
        )}

        {!loading && !error && view === 'students' && !selected && (
          <StudentList students={students} onSelect={setSelected} />
        )}

        {!loading && !error && view === 'students' && selected && (
          <StudentDetail
            student={selected}
            onBack={() => setSelected(null)}
            onSaved={async (updated) => {
              setSelected(updated)
              await loadAll()
            }}
          />
        )}
      </main>
    </div>
  )
}

// ---------- Dashboard ----------

function Dashboard({ analytics }: { analytics: Analytics }) {
  const maxAvg = Math.max(...analytics.dept_averages.map((d) => d.average_percentage), 100)

  return (
    <div className="dashboard">
      <p className="summary">Total students: {analytics.total_students}</p>

      <section className="card">
        <h2>Department-wise average</h2>
        <div className="bar-chart">
          {analytics.dept_averages.map((d) => (
            <div className="bar-row" key={d.department}>
              <span className="bar-label">{d.department}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${(d.average_percentage / maxAvg) * 100}%`,
                    background: d.average_percentage >= 50 ? '#3DD68C' : '#F0A500'
                  }}
                />
              </div>
              <span className="bar-value">{d.average_percentage}%</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Students needing attention</h2>
        {analytics.at_risk_students.length === 0 && <p className="hint">No students at risk.</p>}
        <ul className="risk-list">
          {analytics.at_risk_students.map((s) => (
            <li key={s.id}>
              <span>{s.name}</span>
              <span className="dept-tag">{s.department}</span>
              <span className="status-chip" style={{ color: statusColor(s.status) }}>
                {s.status} · {s.percentage}%
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

// ---------- Student list ----------

function StudentList({
  students,
  onSelect
}: {
  students: Student[]
  onSelect: (s: Student) => void
}) {
  const [query, setQuery] = useState('')
  const filtered = students.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="student-list">
      <input
        className="search"
        placeholder="Search by name"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul>
        {filtered.map((s) => (
          <li key={s.id} onClick={() => onSelect(s)} className="student-row">
            <div>
              <strong>{s.name}</strong>
              <span className="dept-tag">{s.department}</span>
            </div>
            <span className="status-chip" style={{ color: statusColor(s.status) }}>
              {s.status} · {s.percentage}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---------- Student detail (view + edit marks) ----------

function StudentDetail({
  student,
  onBack,
  onSaved
}: {
  student: Student
  onBack: () => void
  onSaved: (s: Student) => void
}) {
  const [editing, setEditing] = useState(false)
  const [assignments, setAssignments] = useState(student.marks.assignments)
  const [internals, setInternals] = useState(student.marks.internals)
  const [externals, setExternals] = useState(student.marks.externals)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const updated = await updateMarks(student.id, { assignments, internals, externals })
    setSaving(false)
    setEditing(false)
    onSaved(updated)
  }

  return (
    <div className="detail card">
      <button className="link-button" onClick={onBack}>
        ← Back to list
      </button>
      <h2>{student.name}</h2>
      <p className="dept-tag">{student.department}</p>
      <p className="status-chip large" style={{ color: statusColor(student.status) }}>
        {student.status} · {student.percentage}%
      </p>

      {!editing ? (
        <>
          <table>
            <tbody>
              <tr>
                <td>Assignments</td>
                <td>{student.marks.assignments} / 20</td>
              </tr>
              <tr>
                <td>Internals</td>
                <td>{student.marks.internals} / 50</td>
              </tr>
              <tr>
                <td>Externals</td>
                <td>{student.marks.externals} / 80</td>
              </tr>
              <tr className="total-row">
                <td>Total</td>
                <td>
                  {student.total} / {student.max_total}
                </td>
              </tr>
            </tbody>
          </table>
          <button onClick={() => setEditing(true)}>Edit marks</button>
        </>
      ) : (
        <div className="edit-form">
          <label>
            Assignments (max 20)
            <input
              type="number"
              value={assignments}
              onChange={(e) => setAssignments(Number(e.target.value))}
            />
          </label>
          <label>
            Internals (max 50)
            <input
              type="number"
              value={internals}
              onChange={(e) => setInternals(Number(e.target.value))}
            />
          </label>
          <label>
            Externals (max 80)
            <input
              type="number"
              value={externals}
              onChange={(e) => setExternals(Number(e.target.value))}
            />
          </label>
          <div className="edit-actions">
            <button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save marks'}
            </button>
            <button className="secondary" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
