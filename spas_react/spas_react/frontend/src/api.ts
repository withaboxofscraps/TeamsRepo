import type { Student, Analytics } from './types'

// Flask runs on port 5000, Vite (this app) runs on 5173 - different ports,
// so we call the full address. If you deploy elsewhere, change this one line.
const BASE_URL = 'http://localhost:5000'

export async function getStudents(): Promise<Student[]> {
  const res = await fetch(`${BASE_URL}/students`)
  if (!res.ok) throw new Error('Failed to load students')
  return res.json()
}

export async function getAnalytics(): Promise<Analytics> {
  const res = await fetch(`${BASE_URL}/analytics`)
  if (!res.ok) throw new Error('Failed to load analytics')
  return res.json()
}

export async function updateMarks(
  studentId: number,
  marks: { assignments: number; internals: number; externals: number }
): Promise<Student> {
  const res = await fetch(`${BASE_URL}/students/${studentId}/marks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(marks)
  })
  if (!res.ok) throw new Error('Failed to update marks')
  return res.json()
}
