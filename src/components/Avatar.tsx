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
        className="shrink-0 rounded-full object-cover ring-1 ring-[#e7e9f2]"
        style={{ width: size, height: size }}
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />
    )
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#eef0ff] font-bold text-[#5969df] ring-1 ring-[#dfe3fb]"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </span>
  )
}
