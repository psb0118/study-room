import { Component, type ErrorInfo, type ReactNode } from 'react'
import { logAppError } from '../lib/errorLog'

interface AppErrorBoundaryState {
  failed: boolean
}

/** 렌더링 중 예상하지 못한 오류를 관리자 로그에 남기고 복구 화면을 보여준다. */
export class AppErrorBoundary extends Component<
  { children: ReactNode },
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logAppError(error, 'react-render')
    console.error('[app] 렌더링 오류:', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8ff] px-4">
        <div className="surface w-full max-w-md p-7 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#ffeff3] text-xl">
            !
          </div>
          <h1 className="mt-4 text-lg font-extrabold text-[#3d3a55]">
            화면을 표시하지 못했어요
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#8b88a3]">
            오류가 관리자에게 기록됐어요. 잠시 후 다시 시도해 주세요.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn btn-primary mt-5 w-full"
          >
            새로고침
          </button>
        </div>
      </div>
    )
  }
}
