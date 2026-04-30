import { Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 lg:px-12 py-5 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard" className="btn-primary">Go to Dashboard →</Link>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">Sign in</Link>
              <Link to="/signup" className="btn-primary">Get started</Link>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 lg:px-12 py-12">
        <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
              Built for modern teams
            </div>
            <h1 className="text-4xl lg:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight">
              Plan, track, and ship work{' '}
              <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
                together.
              </span>
            </h1>
            <p className="mt-5 text-lg text-slate-600 max-w-xl">
              TeamTask gives your team a clean, focused space to organize projects,
              assign tasks, and stay on top of progress — all with role-based access
              for admins and members.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup" className="btn-primary text-base px-6 py-3">
                Start free →
              </Link>
              <Link to="/login" className="btn-secondary text-base px-6 py-3">
                Sign in
              </Link>
            </div>
            <ul className="mt-10 grid grid-cols-2 gap-3 text-sm text-slate-700">
              {[
                'Role-based access (Admin/Member)',
                'Project & team management',
                'Kanban-style task boards',
                'Overdue & progress tracking',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 bg-gradient-to-tr from-brand-200 to-brand-100 rounded-3xl blur-2xl opacity-60" />
            <div className="relative card p-6 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Project</div>
                  <div className="text-lg font-bold text-slate-900">Q4 Launch Plan</div>
                </div>
                <span className="badge bg-emerald-100 text-emerald-700">On track</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {['To do', 'In progress', 'Done'].map((col, i) => (
                  <div key={col} className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xs font-semibold text-slate-500 mb-2">{col}</div>
                    <div className="space-y-2">
                      {[1, 2].map((j) => (
                        <div
                          key={j}
                          className={`p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm ${
                            i === 1 ? 'ring-1 ring-brand-200' : ''
                          }`}
                        >
                          <div className="h-2 w-3/4 bg-slate-200 rounded mb-2" />
                          <div className="h-2 w-1/2 bg-slate-100 rounded" />
                          <div className="mt-2 flex items-center gap-1">
                            <div className="w-5 h-5 rounded-full bg-brand-500" />
                            <div className="h-2 w-10 bg-slate-100 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>4 members</span>
                <span>12 tasks · 5 done</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="px-6 lg:px-12 py-6 text-center text-sm text-slate-500">
        Crafted with <span className="text-brand-600 font-semibold">React</span>,{' '}
        <span className="text-brand-600 font-semibold">Express</span>,{' '}
        <span className="text-brand-600 font-semibold">Prisma</span> &{' '}
        <span className="text-brand-600 font-semibold">PostgreSQL</span>
      </footer>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-brand-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 12l4 4L19 7"/>
    </svg>
  );
}
