import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { Trophy, Award, User, RefreshCw } from 'lucide-react';
import { Chart, BarController, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';

// Register Chart.js components
Chart.register(BarController, CategoryScale, LinearScale, BarElement, Tooltip);

export default function Leaderboard() {
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    loadLeaderboard();
    return () => {
      if (chartInstance.current) chartInstance.current.dispose();
    };
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getLeaderboard();
      const list = data.leaderboard || [];
      setBoard(list);

      // Async initialize chart
      setTimeout(() => {
        if (list.length > 0 && chartRef.current) {
          initChart(list.slice(0, 5));
        }
      }, 100);

    } catch (e) {
      setError(e.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const initChart = (top5) => {
    if (chartInstance.current) chartInstance.current.destroy();
    
    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: top5.map(u => u.username),
        datasets: [{
          data: top5.map(u => u.readiness_score),
          backgroundColor: [
            'rgba(234,179,8,0.7)', // Gold
            'rgba(148,163,184,0.7)', // Silver
            'rgba(180,83,9,0.7)', // Bronze
            'rgba(99,102,241,0.5)',
            'rgba(99,102,241,0.4)'
          ],
          borderColor: [
            'rgb(234,179,8)',
            'rgb(148,163,184)',
            'rgb(180,83,9)',
            'rgb(99,102,241)',
            'rgb(99,102,241)'
          ],
          borderWidth: 2,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (tooltipItem) => ` ${tooltipItem.parsed.y.toFixed(1)}% Readiness`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#94a3b8' }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { 
              color: '#94a3b8',
              callback: (value) => value + '%'
            },
            min: 0,
            max: 100
          }
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="loader"></div>
      </div>
    );
  }

  // Find podium layouts (1st, 2nd, 3rd)
  const first = board[0];
  const second = board[1];
  const third = board[2];

  return (
    <div className="w-full space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white font-outfit">Leaderboard</h2>
          <p className="text-slate-400 mt-1 text-sm">See how your readiness scores rank against other top preparing candidates.</p>
        </div>
        <button 
          onClick={loadLeaderboard}
          className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-400 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Podium display */}
      {board.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 items-end max-w-lg mx-auto bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80">
          {/* 2nd Place */}
          {second && (
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-400 to-slate-300 flex items-center justify-center text-slate-900 font-black text-sm shadow-lg">
                {(second.username || 'U')[0].toUpperCase()}
              </div>
              <p className="text-slate-200 font-bold text-xs truncate max-w-[80px]" title={second.username}>{second.username}</p>
              <p className="text-slate-400 text-[10px] font-semibold">{second.readiness_score?.toFixed(1)}%</p>
              <div className="h-20 w-full bg-gradient-to-t from-slate-500 to-slate-400 rounded-t-lg flex items-end justify-center pb-2">
                <span className="text-slate-900 text-lg font-black">🥈</span>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {first && (
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500 to-amber-400 flex items-center justify-center text-slate-950 font-black text-base shadow-lg animate-bounce">
                {(first.username || 'U')[0].toUpperCase()}
              </div>
              <p className="text-white font-extrabold text-sm truncate max-w-[80px]" title={first.username}>{first.username}</p>
              <p className="text-amber-400 text-xs font-bold">{first.readiness_score?.toFixed(1)}%</p>
              <div className="h-28 w-full bg-gradient-to-t from-yellow-500 to-amber-400 rounded-t-lg flex items-end justify-center pb-2">
                <span className="text-slate-950 text-xl font-black">🥇</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {third && (
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-700 to-amber-600 flex items-center justify-center text-amber-100 font-black text-sm shadow-lg">
                {(third.username || 'U')[0].toUpperCase()}
              </div>
              <p className="text-slate-200 font-bold text-xs truncate max-w-[80px]" title={third.username}>{third.username}</p>
              <p className="text-slate-400 text-[10px] font-semibold">{third.readiness_score?.toFixed(1)}%</p>
              <div className="h-16 w-full bg-gradient-to-t from-amber-700 to-amber-600 rounded-t-lg flex items-end justify-center pb-2">
                <span className="text-amber-100 text-lg font-black">🥉</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chart & Scoreboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Chart */}
        {board.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col h-[280px]">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Top 5 Performers</h3>
            <div className="flex-1 relative">
              <canvas ref={chartRef}></canvas>
            </div>
          </div>
        )}

        {/* Scoreboard List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-y-auto max-h-[280px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-950/40 text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                  <th className="p-3 text-center">Rank</th>
                  <th className="p-3">User</th>
                  <th className="p-3 text-center">Readiness</th>
                  <th className="p-3 text-center">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-xs">
                {board.map((u, i) => {
                  const isTop3 = i < 3;
                  const rankColor = i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-slate-500';
                  const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${u.rank}`;

                  return (
                    <tr key={i} className="hover:bg-slate-850/30 transition-colors">
                      <td className="p-3 text-center">
                        <span className={`font-black ${rankColor} text-sm`}>{rankEmoji}</span>
                      </td>
                      <td className="p-3 font-semibold text-slate-200">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-900/30 border border-indigo-700/20 text-[10px] text-indigo-400 font-extrabold flex items-center justify-center">
                            {(u.username || 'U')[0].toUpperCase()}
                          </div>
                          <span>{u.username}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-300">
                        {u.readiness_score?.toFixed(1)}%
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-green-950/60 border border-green-800 text-green-400 rounded-full text-[9px] font-bold">
                          {u.rounds_cleared || 0} Rounds
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
