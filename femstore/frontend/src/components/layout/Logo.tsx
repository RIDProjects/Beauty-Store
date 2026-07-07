export default function LogoSVG({ className = '' }: { className?: string }) {
  return (
    <img
      src="/logo-vainybliss.png"
      alt="Vainy Bliss"
      className={`object-contain dark:[filter:drop-shadow(0_0_1px_rgba(255,255,255,0.9))_drop-shadow(0_0_8px_rgba(255,255,255,0.35))] ${className}`}
    />
  );
}
