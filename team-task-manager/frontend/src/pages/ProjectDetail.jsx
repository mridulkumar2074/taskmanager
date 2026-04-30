import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import client from '../api/client';
import Modal from '../components/Modal.jsx';
import { StatusBadge, PriorityBadge, RoleBadge } from '../components/Badge.jsx';
import { formatDate, formatRelative, isOverdue, toInputDate } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';

const COLUMNS = [
  { id: 'TODO', label: 'To do', accent: 'bg-slate-100 text-slate-700' },
  { id: 'IN_PROGRESS', label: 'In progress', accent: 'bg-blue-100 text-blue-700' },
  { id: 'DONE', label: 'Done', accent: 'bg-emerald-100 text-emerald-700' },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState({ assignee: 'all', priority: 'all' });

  const myMembership = useMemo(() => {
    if (!project) return null;
    return project.members.find((m) => m.user.id === user.id);
  }, [project, user]);

  const isProjectAdmin =
    user?.role === 'ADMIN' ||
    myMembership?.role === 'OWNER' ||
    myMembership?.role === 'ADMIN';

  const isOwner = user?.role === 'ADMIN' || myMembership?.role === 'OWNER';

  const load = async () => {
    setLoading(true);
    try {
      const [pr, ts] = await Promise.all([
        client.get(`/projects/${id}`),
        client.get(`/projects/${id}/tasks`),
      ]);
      setProject(pr.data.project);
      setTasks(ts.data.tasks);
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 403) {
        toast.error('Project not found or access denied');
        navigate('/projects');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filter.assignee === 'mine' && t.assignee?.id !== user.id) return false;
      if (filter.assignee === 'unassigned' && t.assignee) return false;
      if (filter.priority !== 'all' && t.priority !== filter.priority) return false;
      return true;
    });
  }, [tasks, filter, user]);

  const grouped = useMemo(() => {
    const g = { TODO: [], IN_PROGRESS: [], DONE: [] };
    for (const t of filteredTasks) g[t.status]?.push(t);
    return g;
  }, [filteredTasks]);

  const handleStatusChange = async (task, newStatus) => {
    if (task.status === newStatus) return;
    const prev = tasks;
    setTasks((tt) => tt.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
    try {
      await client.put(`/tasks/${task.id}`, { status: newStatus });
      toast.success('Task updated');
    } catch (err) {
      setTasks(prev);
      toast.error(err.response?.data?.message || 'Could not update task');
    }
  };

  const handleDeleteTask = async (task) => {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    try {
      await client.delete(`/tasks/${task.id}`);
      setTasks((tt) => tt.filter((t) => t.id !== task.id));
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete task');
    }
  };

  if (loading || !project) {
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="h-10 w-72 bg-slate-200 rounded animate-pulse" />
        <div className="grid lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-96 animate-pulse bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === 'DONE').length,
    overdue: tasks.filter(isOverdue).length,
  };
  const progress = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Link to="/projects" className="text-sm text-brand-600 hover:underline inline-flex items-center gap-1">
        ← Back to projects
      </Link>

      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-2xl shadow-md">
              {project.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">{project.name}</h1>
              <p className="text-slate-600 mt-1 max-w-2xl">
                {project.description || 'No description provided.'}
              </p>
              <div className="mt-2 text-xs text-slate-500">
                Created {formatDate(project.createdAt)} · Owner {project.owner.name}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowMembers(true)} className="btn-secondary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 0 0-3-3.87M9 20H4v-2a4 4 0 0 1 3-3.87m10-3.13a4 4 0 1 0-8 0 4 4 0 0 0 8 0z"/>
              </svg>
              Members ({project.members.length})
            </button>
            {isProjectAdmin && (
              <button onClick={() => setShowSettings(true)} className="btn-secondary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                </svg>
                Settings
              </button>
            )}
            <button onClick={() => { setEditingTask(null); setShowTaskModal(true); }} className="btn-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v14M5 12h14"/>
              </svg>
              New task
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <Stat label="Total tasks" value={stats.total} />
          <Stat label="Completed" value={`${stats.done} / ${stats.total}`} />
          <Stat label="Overdue" value={stats.overdue} accent={stats.overdue > 0 ? 'text-rose-600' : ''} />
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
            <span>Project progress</span>
            <span className="text-brand-700">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <FilterPill
          options={[
            { value: 'all', label: 'All assignees' },
            { value: 'mine', label: 'Assigned to me' },
            { value: 'unassigned', label: 'Unassigned' },
          ]}
          value={filter.assignee}
          onChange={(v) => setFilter({ ...filter, assignee: v })}
        />
        <FilterPill
          options={[
            { value: 'all', label: 'Any priority' },
            { value: 'HIGH', label: 'High' },
            { value: 'MEDIUM', label: 'Medium' },
            { value: 'LOW', label: 'Low' },
          ]}
          value={filter.priority}
          onChange={(v) => setFilter({ ...filter, priority: v })}
        />
      </div>

      {/* Kanban */}
      <div className="grid lg:grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <div key={col.id} className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 flex flex-col">
            <div className="flex items-center justify-between px-2 py-1 mb-2">
              <div className="flex items-center gap-2">
                <span className={`badge ${col.accent}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {col.label}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {grouped[col.id].length}
                </span>
              </div>
              <button
                onClick={() => {
                  setEditingTask({ status: col.id });
                  setShowTaskModal(true);
                }}
                className="text-slate-400 hover:text-brand-600 transition"
                title="Add task"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v14M5 12h14"/>
                </svg>
              </button>
            </div>
            <div className="space-y-2 flex-1 min-h-[200px]">
              {grouped[col.id].length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-8 border-2 border-dashed border-slate-200 rounded-lg">
                  No tasks
                </div>
              ) : (
                grouped[col.id].map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => {
                      setEditingTask(task);
                      setShowTaskModal(true);
                    }}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDeleteTask}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <TaskModal
        open={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
        }}
        project={project}
        task={editingTask?.id ? editingTask : null}
        defaultStatus={editingTask && !editingTask.id ? editingTask.status : 'TODO'}
        onSaved={(saved, action) => {
          if (action === 'create') setTasks((tt) => [saved, ...tt]);
          else setTasks((tt) => tt.map((t) => (t.id === saved.id ? saved : t)));
          setShowTaskModal(false);
          setEditingTask(null);
        }}
      />

      <MembersModal
        open={showMembers}
        onClose={() => setShowMembers(false)}
        project={project}
        canManage={isProjectAdmin}
        onChanged={load}
      />

      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        project={project}
        canDelete={isOwner}
        onSaved={(p) => {
          setProject(p);
          setShowSettings(false);
        }}
        onDeleted={() => navigate('/projects')}
      />
    </div>
  );
}

function Stat({ label, value, accent = '' }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`text-xl font-extrabold mt-0.5 ${accent || 'text-slate-900'}`}>{value}</div>
    </div>
  );
}

function FilterPill({ options, value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input py-2 text-sm w-auto pr-8"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function TaskCard({ task, onClick, onStatusChange, onDelete }) {
  const overdue = isOverdue(task);
  const nextStatus = task.status === 'TODO' ? 'IN_PROGRESS' : task.status === 'IN_PROGRESS' ? 'DONE' : null;

  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-lg p-3 cursor-pointer hover:border-brand-300 hover:shadow-soft transition group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-sm text-slate-900 group-hover:text-brand-700 line-clamp-2">
          {task.title}
        </h4>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task);
          }}
          className="text-slate-300 hover:text-rose-500 transition opacity-0 group-hover:opacity-100"
          title="Delete"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>
          </svg>
        </button>
      </div>
      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-2">{task.description}</p>
      )}
      <div className="flex items-center gap-1.5 flex-wrap">
        <PriorityBadge priority={task.priority} />
        {task.dueDate && (
          <span
            className={`badge ${
              overdue ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="5" width="18" height="16" rx="2" strokeWidth="2"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M8 3v4M16 3v4"/>
            </svg>
            {formatRelative(task.dueDate)}
          </span>
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        {task.assignee ? (
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold flex items-center justify-center">
              {task.assignee.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-slate-600 font-medium truncate max-w-[120px]">
              {task.assignee.name}
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">Unassigned</span>
        )}
        {nextStatus && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(task, nextStatus);
            }}
            className="text-xs font-semibold text-brand-600 hover:text-brand-800 transition"
          >
            {task.status === 'TODO' ? 'Start →' : 'Complete ✓'}
          </button>
        )}
      </div>
    </div>
  );
}

function TaskModal({ open, onClose, project, task, defaultStatus, onSaved }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: defaultStatus || 'TODO',
    priority: 'MEDIUM',
    assigneeId: '',
    dueDate: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'TODO',
        priority: task.priority || 'MEDIUM',
        assigneeId: task.assignee?.id ? String(task.assignee.id) : '',
        dueDate: toInputDate(task.dueDate) || '',
      });
    } else {
      setForm({
        title: '',
        description: '',
        status: defaultStatus || 'TODO',
        priority: 'MEDIUM',
        assigneeId: '',
        dueDate: '',
      });
    }
  }, [open, task, defaultStatus]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: form.status,
        priority: form.priority,
        assigneeId: form.assigneeId ? Number(form.assigneeId) : null,
        dueDate: form.dueDate || null,
      };
      let saved;
      if (isEdit) {
        const { data } = await client.put(`/tasks/${task.id}`, payload);
        saved = data.task;
        toast.success('Task updated');
        onSaved(saved, 'update');
      } else {
        const { data } = await client.post(`/projects/${project.id}/tasks`, payload);
        saved = data.task;
        toast.success('Task created');
        onSaved(saved, 'create');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit task' : 'Create new task'} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Title *</label>
          <input
            type="text"
            required
            autoFocus
            className="input"
            placeholder="What needs to be done?"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            className="input min-h-[100px] resize-y"
            placeholder="Add more details (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="TODO">To do</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select
              className="input"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div>
            <label className="label">Assignee</label>
            <select
              className="input"
              value={form.assigneeId}
              onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
            >
              <option value="">Unassigned</option>
              {project.members.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.name} ({m.user.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Due date</label>
            <input
              type="date"
              className="input"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function MembersModal({ open, onClose, project, canManage, onChanged }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [submitting, setSubmitting] = useState(false);

  const addMember = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await client.post(`/projects/${project.id}/members`, { email, role });
      toast.success('Member added');
      setEmail('');
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add member');
    } finally {
      setSubmitting(false);
    }
  };

  const removeMember = async (member) => {
    if (!confirm(`Remove ${member.user.name} from the project?`)) return;
    try {
      await client.delete(`/projects/${project.id}/members/${member.user.id}`);
      toast.success('Member removed');
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove member');
    }
  };

  const changeRole = async (member, newRole) => {
    try {
      await client.put(`/projects/${project.id}/members/${member.user.id}`, { role: newRole });
      toast.success('Role updated');
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update role');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Project members" size="lg">
      {canManage && (
        <form onSubmit={addMember} className="flex flex-col sm:flex-row gap-2 mb-5 pb-5 border-b border-slate-100">
          <input
            type="email"
            required
            placeholder="member@email.com"
            className="input flex-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select className="input sm:w-32" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button type="submit" disabled={submitting} className="btn-primary">
            Add
          </button>
        </form>
      )}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {project.members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white font-bold flex items-center justify-center">
              {m.user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-900 truncate">{m.user.name}</div>
              <div className="text-xs text-slate-500 truncate">{m.user.email}</div>
            </div>
            <RoleBadge role={m.role} />
            {canManage && m.role !== 'OWNER' && (
              <div className="flex items-center gap-1">
                <select
                  value={m.role}
                  onChange={(e) => changeRole(m, e.target.value)}
                  className="text-xs border border-slate-200 rounded-md py-1 px-2 bg-white"
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <button
                  onClick={() => removeMember(m)}
                  className="text-slate-400 hover:text-rose-500 p-1.5 rounded-md hover:bg-rose-50"
                  title="Remove"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}

function SettingsModal({ open, onClose, project, canDelete, onSaved, onDeleted }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && project) {
      setForm({ name: project.name, description: project.description || '' });
    }
  }, [open, project]);

  const save = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await client.put(`/projects/${project.id}`, form);
      toast.success('Project updated');
      onSaved(data.project);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save project');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete project "${project.name}" and all its tasks? This cannot be undone.`)) return;
    try {
      await client.delete(`/projects/${project.id}`);
      toast.success('Project deleted');
      onDeleted();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete project');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Project settings">
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input
            className="input"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            className="input min-h-[100px] resize-y"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
      {canDelete && (
        <div className="mt-6 pt-5 border-t border-slate-100">
          <h4 className="text-sm font-bold text-rose-700 mb-1">Danger zone</h4>
          <p className="text-xs text-slate-500 mb-3">
            Deleting this project will permanently remove all its tasks and members.
          </p>
          <button onClick={remove} className="btn-danger">Delete project</button>
        </div>
      )}
    </Modal>
  );
}
