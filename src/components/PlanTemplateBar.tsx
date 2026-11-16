import { useState } from 'react'
import {
  deletePlanTemplate,
  loadPlanTemplates,
  savePlanTemplate,
  templateFromPlanInput,
  type PlanTemplate,
} from '../lib/planTemplates'
import type { PlanInput, Subject } from '../types'

export function PlanTemplateBar({
  form,
  subjects,
  onApply,
}: {
  form: PlanInput
  subjects: Subject[]
  onApply: (template: PlanTemplate) => void
}) {
  const [templates, setTemplates] = useState<PlanTemplate[]>(() =>
    loadPlanTemplates(),
  )
  const [notice, setNotice] = useState<string | null>(null)

  const save = () => {
    const input = templateFromPlanInput(form)
    if (!input) {
      setNotice('제목과 과목을 먼저 입력해 주세요.')
      return
    }
    setTemplates(savePlanTemplate(input))
    setNotice('현재 계획을 템플릿으로 저장했어요.')
  }

  const remove = (id: string) => {
    setTemplates(deletePlanTemplate(id))
    setNotice('템플릿을 삭제했어요.')
  }

  return (
    <section className="mb-4 rounded-xl border border-[#e6e1ff] bg-[#faf9ff] p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-xs font-extrabold text-[#3d3a55]">
            내 계획 템플릿
          </h3>
          <p className="mt-0.5 text-[11px] text-[#a8a5bb]">
            날짜와 상태를 빼고 저장해 다음 계획에 바로 적용할 수 있어요.
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={!form.title.trim() || !form.subjectId}
          className="rounded-lg border border-[#d6d1ff] bg-white px-2.5 py-1.5 text-[11px] font-extrabold text-[#6a63c9] transition hover:bg-[#f1eeff] disabled:cursor-not-allowed disabled:opacity-50"
        >
          현재 내용 저장
        </button>
      </div>

      {templates.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {templates.map((template) => {
            const subject = subjects.find((item) => item.id === template.subjectId)
            return (
              <div
                key={template.id}
                className="flex max-w-full items-center gap-1 rounded-lg border border-[#e6e1ff] bg-white pl-2.5"
              >
                <button
                  type="button"
                  onClick={() => {
                    onApply(template)
                    setNotice(`“${template.title}” 템플릿을 적용했어요.`)
                  }}
                  className="min-w-0 py-2 text-left"
                >
                  <span className="block max-w-[210px] truncate text-xs font-extrabold text-[#5f5c78]">
                    {template.title}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-[#a8a5bb]">
                    {subject?.name ?? '과목 없음'} · {template.targetMinutes}분
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => remove(template.id)}
                  aria-label={`${template.title} 템플릿 삭제`}
                  className="grid h-8 w-7 shrink-0 place-items-center text-sm text-[#b8b5c9] transition hover:text-[#d96a7c]"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-[#ddd8f0] bg-white px-3 py-2 text-[11px] text-[#a8a5bb]">
          저장된 템플릿이 없어요. 계획을 입력한 뒤 현재 내용을 저장해 보세요.
        </p>
      )}

      {notice && (
        <p className="mt-2 text-[11px] font-semibold text-[#6f68e8]">
          {notice}
        </p>
      )}
    </section>
  )
}
