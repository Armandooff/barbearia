export default function BarberIllustration({ className = '' }) {
  return (
    <img
      src="/barber.svg"
      alt="Barbeiro"
      className={`pointer-events-none select-none ${className}`}
      draggable={false}
    />
  );
}