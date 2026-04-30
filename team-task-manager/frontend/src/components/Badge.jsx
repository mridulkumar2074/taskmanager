const STATUS_STYLES = {
  TODO: 'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-emerald-100 text-emerald-700',
};

const PRIORITY_STYLES = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-rose-100 text-rose-700',
};

const ROLE_STYLES = {
  ADMIN: 'bg-brand-100 text-brand-800',
  OWNER: 'bg-indigo-100 text-indigo-800',
  MEMBER: 'bg-slate-100 text-slate-700',
};

const STATUS_LABELS = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
};

export function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_STYLES[status] || STATUS_STYLES.TODO}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  return (
    <span className={`badge ${PRIORITY_STYLES[priority] || PRIORITY_STYLES.MEDIUM}`}>
      {priority}
    </span>
  );
}

export function RoleBadge({ role }) {
  return (
    <span className={`badge ${ROLE_STYLES[role] || ROLE_STYLES.MEMBER}`}>
      {role}
    </span>
  );
}
