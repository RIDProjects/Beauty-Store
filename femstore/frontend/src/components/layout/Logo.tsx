export default function LogoSVG({ className = '' }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="Vainy Bliss"
      className={`object-contain ${className}`}
    />
  );
}
