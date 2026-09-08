export const groups = ['111', '310', '311', '511'] as const;
export type GroupCode = typeof groups[number];

export type Course = {
  code: string;
  group: GroupCode;
  available: boolean;
  title: string;
};

export const courses: Course[] = [
  { code: 'PEAR-00', group: '111', available: false, title: 'Módulo PEAR' },
  { code: 'MSII-21', group: '310', available: false, title: 'Módulo MSII' },
  { code: 'ASIN-21', group: '310', available: false, title: 'Módulo ASIN' },
  { code: 'EDOA-21', group: '311', available: true, title: 'Edición de documentos' },
  { code: 'MTCS-20', group: '511', available: false, title: 'Módulo MTCS' },
];

export function coursesFor(group: string) {
  return courses.filter(course => course.group === group);
}

export function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || 'estudiante';
}
