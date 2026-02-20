import { useEffect, useState } from 'react';

const StatCard = ({ icon, label, value, accent = 'text-white' }) => {
  const target = Number(value) || 0;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frameId;
    const duration = 600;
    const start = performance.now();

    const tick = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      setDisplayValue(Math.floor(target * progress));
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [target]);

  return (
    <div className="placement-stat-card bg-[#1e293b] rounded-xl shadow-lg border border-slate-700 p-6 transition duration-300 hover:shadow-xl">
      <div className="placement-stat-icon">{icon}</div>
      <p className="placement-stat-label text-slate-200 font-semibold">{label}</p>
      <h3 className={`placement-stat-value text-3xl font-extrabold tracking-tight text-white ${accent}`}>{displayValue}</h3>
    </div>
  );
};

export default StatCard;
