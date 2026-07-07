export default function LogoSVG({ className = '' }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 300 50" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <text
        x="10"
        y="38"
        fontFamily="'Cormorant', Georgia, serif"
        fontSize="28"
        fontWeight="700"
        fill="#5C8C68"
      >
        Vainy
      </text>
      <text
        x="110"
        y="38"
        fontFamily="'Cormorant', Georgia, serif"
        fontSize="28"
        fontWeight="400"
        fill="#BBA67A"
      >
        Bliss
      </text>
    </svg>
  );
}