import { useAuth } from '../context/AuthContext.jsx';
import { RoleBadge } from '../components/Badge.jsx';
import { formatDate } from '../utils/format.js';

export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900">Profile</h1>
        <p className="text-slate-600 mt-1">Your account information.</p>
      </header>

      <div className="card p-8">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-extrabold text-3xl shadow-md">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
            <p className="text-slate-500">{user.email}</p>
            <div className="mt-2"><RoleBadge role={user.role} /></div>
          </div>
        </div>

        <dl className="grid sm:grid-cols-2 gap-4 pt-6 border-t border-slate-100">
          <Field label="Full name" value={user.name} />
          <Field label="Email" value={user.email} />
          <Field label="Role" value={user.role} />
          <Field label="Member since" value={formatDate(user.createdAt)} />
        </dl>
      </div>

      <div className="card p-6 bg-brand-50/50 border-brand-100">
        <h3 className="font-bold text-brand-900">About roles</h3>
        <p className="text-sm text-brand-800/80 mt-1">
          <strong>Admin</strong> users can manage all users and access every project.{' '}
          <strong>Member</strong> users only see projects they belong to.
          Within a project, an <strong>Owner</strong> or project <strong>Admin</strong> can add members and edit settings.
        </p>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-900 font-medium">{value || '—'}</dd>
    </div>
  );
}
