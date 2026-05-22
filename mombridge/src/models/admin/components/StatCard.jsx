import "./admin.css";

export default function StatCard({ title, value }) {
  return (
    <div className="stat-card">
      <h4>{title}</h4>
      <p>{value}</p>
    </div>
  );
}
