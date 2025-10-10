import { useState, useEffect } from 'react';

export const usePlatformStats = () => {
  const [stats, setStats] = useState({
    ai_consultations: 89,
    active_crops: 12,
    cost_savings: 15000,
    accuracy_rate: 95
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/stats/platform-stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        // Keep default demo stats if API fails
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading };
};