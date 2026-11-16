import { describe, expect, it } from 'vitest'
import type { PlanInput } from '../types'
import {
  normalizePlanTemplates,
  templateFromPlanInput,
} from './planTemplates'

const validTemplate = {
  id: 'template-1',
  title: '수학 30분',
  subjectId: 'math',
  description: '문제집 한 장',
  targetMinutes: 30,
  priority: 'high',
  startTime: '18:00',
  endTime: '18:30',
  memo: '',
  createdAt: 1,
}

const planInput: PlanInput = {
  subjectId: 'math',
  title: '수학 30분',
  description: '문제집 한 장',
  plannedDate: '2026-11-11',
  startTime: '18:00',
  endTime: '18:30',
  targetMinutes: 30,
  priority: 'high',
  status: 'planned',
  completedAt: 0,
  memo: '',
}

describe('plan templates', () => {
  it('drops invalid stored templates', () => {
    const templates = normalizePlanTemplates([
      validTemplate,
      { ...validTemplate, id: 'bad-time', endTime: '17:00' },
      { ...validTemplate, id: 'bad-minutes', targetMinutes: 0 },
      { ...validTemplate, id: '' },
    ])
    expect(templates).toHaveLength(1)
    expect(templates[0].id).toBe('template-1')
  })

  it('stores reusable fields without the date or status', () => {
    expect(templateFromPlanInput(planInput)).toEqual({
      title: '수학 30분',
      subjectId: 'math',
      description: '문제집 한 장',
      targetMinutes: 30,
      priority: 'high',
      startTime: '18:00',
      endTime: '18:30',
      memo: '',
    })
    expect(templateFromPlanInput({ ...planInput, title: '  ' })).toBeNull()
  })
})
