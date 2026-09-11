// Mirrors what Flask sends back - keeps the frontend in sync with the backend.

export interface Student {
  id: number
  name: string
  department: string
  marks: {
    assignments: number
    internals: number
    externals: number
  }
  total: number
  max_total: number
  percentage: number
  status: 'PASS' | 'AT RISK' | 'FAIL'
}

export interface DeptAverage {
  department: string
  average_percentage: number
}

export interface Analytics {
  dept_averages: DeptAverage[]
  at_risk_students: Student[]
  total_students: number
}
