import { renderToStaticMarkup } from 'react-dom/server'
import type { User } from 'firebase/auth'
import { describe, expect, it } from 'vitest'
import { defaultProfile } from '../lib/profile'
import { AdminStudentPreview } from './AdminStudentPreview'

describe('AdminStudentPreview', () => {
  it('renders the demo student planner for an administrator', () => {
    const admin = defaultProfile({
      uid: 'admin-preview-user',
      email: 'admin@example.com',
      displayName: '관리자',
      photoURL: null,
    } as User)

    const html = renderToStaticMarkup(
      <AdminStudentPreview admin={admin} onExit={() => undefined} />,
    )

    expect(html).toContain('학생 플래너 미리보기')
    expect(html).toContain('테스트 학생')
    expect(html).toContain('오늘의 공부 계획')
    expect(html).toContain('수학 문제집 2단원')
  })
})
