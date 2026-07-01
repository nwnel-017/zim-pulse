import Image from "next/image";

export type AppLogoProps = {
  alt?: string;
  className?: string;
  preload?: boolean;
};

export default function AppLogo({
  alt = "Zim Pulse",
  className,
  preload = false,
}: AppLogoProps) {
  return (
    <Image
      alt={alt}
      className={className}
      height={62}
      preload={preload}
      src="/logos/app_logo.png"
      width={160}
    />
  );
}
