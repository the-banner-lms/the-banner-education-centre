export const STUDENT_CLASSES = [
  { value: 'pre-kg', label: 'Pre-KG' },
  { value: 'kg', label: 'KG' },
  { value: 'yle', label: 'YLE' },
  { value: 'primary1', label: 'Primary 1' },
  { value: 'primary2', label: 'Primary 2' },
  { value: 'primary3', label: 'Primary 3' },
  { value: 'primary4', label: 'Primary 4' },
  { value: 'primary5', label: 'Primary 5' },
  { value: 'primary6', label: 'Primary 6' },
] as const

export type StudentClass = (typeof STUDENT_CLASSES)[number]['value']

export function isStudentClass(value: string): value is StudentClass {
  return STUDENT_CLASSES.some((studentClass) => studentClass.value === value)
}

export function getStudentClassLabel(value: string | null | undefined) {
  return STUDENT_CLASSES.find((studentClass) => studentClass.value === value)?.label ?? 'Unassigned'
}
