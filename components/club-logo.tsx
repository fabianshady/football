import Image from 'next/image'

interface ClubLogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'h-10 w-10',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
}

export function ClubLogo({ size = 'md', className = '' }: ClubLogoProps) {
  return (
    <div className={`${sizes[size]} rounded-full bg-primary/20 flex items-center justify-center ${className}`}>
      {
        <Image
          src="https://vpl0mb2pgnbucvy2.public.blob.vercel-storage.com/logo.png"
          alt="Logo del Club"
          width={size === 'lg' ? 96 : size === 'md' ? 64 : 40}
          height={size === 'lg' ? 96 : size === 'md' ? 64 : 40}
          className="rounded-full object-cover"
        />
      }
    </div>
  )
}
