export default function LogoSVG({ className = '' }: { className?: string }) {
  return (
    <img
      src="/logo-vainybliss.png"
      alt="Vainy Bliss"
      className={`object-contain dark:brightness-0 dark:invert ${className}`}
    />
  );
}
