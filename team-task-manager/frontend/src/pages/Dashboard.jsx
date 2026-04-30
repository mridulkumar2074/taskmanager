import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import StatCard from '../components/StatCard.jsx';
import { StatusBadge, PriorityBadge } from '../components/Badge.jsx';
import { formatRelative, isOverdue } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get('/dashboard')
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  const stats = data?.stats || {};
  const recentTasks = data?.recentTasks || [];
  const myTasks = data?.myTasks || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Welcome back,</p>
          <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
            {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-600 mt-1">
            Here's an overview of your team's progress.
          </p>
        </div>
        <Link to="/projects" className="btn-primary">
          View all projects →
        </Link>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Projects"
          value={stats.projectsCount || 0}
          accent="brand"
          icon={<IconFolder />}
        />
        <StatCard
          label="Total Tasks"
          value={stats.totalTasks || 0}
          accent="blue"
          icon={<IconList />}
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress || 0}
          accent="amber"
          icon={<IconClock />}
        />
        <StatCard
          label="Done"
          value={stats.done || 0}
          accent="green"
          icon={<IconCheck />}
        />
        <StatCard
          label="Overdue"
          value={stats.overdue || 0}
          accent="red"
          icon={<IconAlert />}
          sub={stats.overdue > 0 ? 'Needs attention' : 'All on track'}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">My open tasks</h2>
            <span className="text-xs font-semibold text-slate-500">{myTasks.length}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {myTasks.length === 0 ? (
              <Empty message="You're all caught up! 🎉" />
            ) : (
              myTasks.map((t) => (
                <Link
                  key={t.id}
                  to={`/projects/${t.project.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate group-hover:text-brand-700">
                      {t.title}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="truncate">{t.project.name}</span>
                      {t.dueDate && (
                        <>
                          <span>·</span>
                          <span className={isOverdue(t) ? 'text-rose-600 font-semibold' : ''}>
                            {formatRelative(t.dueDate)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={t.status} />
                  <PriorityBadge priority={t.priority} />
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Recent activity</h2>
            <span className="text-xs font-semibold text-slate-500">{recentTasks.length}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {recentTasks.length === 0 ? (
              <Empty message="No tasks yet. Create your first project!" />
            ) : (
              recentTasks.map((t) => (
                <Link
                  key={t.id}
                  to={`/projects/${t.project.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition group"
                >
                  <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
                    {(t.assignee?.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate group-hover:text-brand-700">
                      {t.title}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {t.project.name} · {t.assignee ? t.assignee.name : 'Unassigned'}
                    </div>
                  </div>
                  <StatusBadge status={t.status} />
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="h-10 w-72 bg-slate-200 rounded animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card p-5 h-24 animate-pulse bg-slate-100" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card h-96 animate-pulse bg-slate-100" />
        <div className="card h-96 animate-pulse bg-slate-100" />
      </div>
    </div>
  );
}

function Empty({ message }) {
  return <div className="px-5 py-10 text-center text-sm text-slate-400">{message}</div>;
}

function IconFolder() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    </svg>
  );
}
function IconList() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
    </svg>
  );
}
function IconClock() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" strokeWidth="2"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 7v5l3 2"/>
    </svg>
  );
}
function IconCheck() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 12l4 4L19 7"/>
    </svg>
  );
}
function IconAlert() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 4h.01M5 19h14a2 2 0 0 0 1.7-3l-7-12a2 2 0 0 0-3.4 0l-7 12a2 2 0 0 0 1.7 3z"/>
    </svg>
  );
}
