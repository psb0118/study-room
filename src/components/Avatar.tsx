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
        className="shrink-0 rounded-full object-cover ring-1 ring-[#ece8f7]"
        style={{ width: size, height: size }}
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />
    )
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#f1eeff] font-bold text-[#7c74f0] ring-1 ring-[#e6e1ff]"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </span>
  )
}
