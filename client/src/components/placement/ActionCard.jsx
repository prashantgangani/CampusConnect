const ActionCard = ({ title, description, onClick, badgeText }) => (
  <button
    type="button"
    className="placement-action-card bg-gradient-to-r from-indigo-700 to-blue-700 rounded-xl p-5 text-white transition hover:scale-105 border border-blue-400/30"
    onClick={onClick}
  >
    <div className="placement-action-header">
      <h4 className="text-white font-bold">{title}</h4>
      {badgeText ? <span className="placement-action-badge">{badgeText}</span> : null}
    </div>
    <p className="text-slate-100 font-medium leading-relaxed">{description}</p>
  </button>
);

export default ActionCard;
