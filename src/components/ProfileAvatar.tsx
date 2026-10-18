import React from "react";

interface ProfileAvatarProps {
  name: string;
  photo?: string;
  className?: string;
  textClassName?: string;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ name, photo, className = "h-9 w-9", textClassName = "text-xs" }) => (
  <div className={`${className} flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border-mid)] bg-[var(--bg-active)]`}>
    {photo ? <img src={photo} alt={name} className="h-full w-full object-cover" /> : <span className={`${textClassName} font-bold text-[var(--foreground)]`}>{name.charAt(0).toUpperCase()}</span>}
  </div>
);
