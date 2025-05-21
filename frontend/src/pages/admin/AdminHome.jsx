import React from 'react';

function AdminHome({ stats }) {
  if (!stats) {
    return <div>Keine Statistiken verfügbar.</div>;
  }

  return (
    <div className="admin-home">
      <h1>Willkommen im Admin-Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Artikel insgesamt</h3>
          <p>{stats.total_articles}</p>
        </div>
        <div className="stat-card">
          <h3>Verfügbare Artikel</h3>
          <p>{stats.available_articles}</p>
        </div>
        <div className="stat-card">
          <h3>Offene Anfragen</h3>
          <p>{stats.open_requests}</p>
        </div>
        <div className="stat-card">
          <h3>Abgeschlossene Anfragen</h3>
          <p>{stats.completed_requests}</p>
        </div>
        <div className="stat-card">
          <h3>Stornierte Anfragen</h3>
          <p>{stats.cancelled_requests}</p>
        </div>
      </div>

      <h2>Letzte Aktivitäten</h2>
      <ul>
        {stats.recent_activities.length === 0 ? (
          <li>Keine Aktivitäten.</li>
        ) : (
          stats.recent_activities.map(act => (
            <li key={act.id}>
              Anfrage #{act.id} von {act.customer_name} – Status: {act.status} ({act.request_date})
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default AdminHome;
