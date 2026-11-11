import type {
  StudyPlan,
  StudyRecord,
  Subject,
  UserProfile,
} from '../types'

export interface ExportBundle {
  app: '하루결'
  version: 1
  exportedAt: string
  exportedBy: {
    uid: string
    name: string
    role: UserProfile['role']
  }
  profile: UserProfile
  subjects: Subject[]
  plans: StudyPlan[]
  records: StudyRecord[]
}

interface BuildExportInput {
  exportedBy: UserProfile
  target: UserProfile
  subjects?: Subject[]
  plans?: StudyPlan[]
  records?: StudyRecord[]
}

/**
 * 현재 화면에 불러온 학습 데이터를 그대로 JSON으로 묶는다.
 * 네트워크를 다시 호출하지 않아 오프라인에서도 내보낼 수 있다.
 */
export function buildExportBundle(
  input: BuildExportInput,
  now = new Date(),
): ExportBundle {
  return {
    app: '하루결',
    version: 1,
    exportedAt: now.toISOString(),
    exportedBy: {
      uid: input.exportedBy.uid,
      name: input.exportedBy.name,
      role: input.exportedBy.role,
    },
    profile: { ...input.target },
    subjects: (input.subjects ?? []).map((subject) => ({ ...subject })),
    plans: (input.plans ?? []).map((plan) => ({ ...plan })),
    records: (input.records ?? []).map((record) => ({ ...record })),
  }
}

/** 파일 이름에 쓸 수 없는 문자를 제거하고 날짜를 붙인다. */
export function exportFileName(
  profile: Pick<UserProfile, 'name' | 'nickname'>,
  now = new Date(),
): string {
  const rawName = profile.nickname.trim() || profile.name.trim() || '하루결'
  const safeName =
    rawName.replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 40) || '하루결'
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
  return `haru-gyeol-${safeName}-${date}.json`
}
