interface AvatarProps {
  name: string
  photo?: string
  size?: number
}

export function Avatar({ name, photo, size = 32 }: AvatarProps) {
  const initial = name.trim().slice(0, 1).toUpperCase() ?? '?'
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-ring ring-1 ring-white/15"
        style={{ width: size, height: size }}
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />
    )
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-indigo-500/30 font-semibold text-indigo-200 ring-1 ring-indigo-400/30"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </span>
  )
}
