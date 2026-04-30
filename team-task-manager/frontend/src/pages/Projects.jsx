import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import client from '../api/client';
import Modal from '../components/Modal.jsx';
import { formatDate } from '../utils/format.js';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/projects');
      setProjects(data.projects);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Projects</h1>
          <p className="text-slate-600 mt-1">Manage all your team's projects in one place.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v14M5 12h14"/>
          </svg>
          New Project
        </button>
      </header>

      <div className="relative max-w-md">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"/>
        </svg>
        <input
          type="text"
          placeholder="Search projects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card h-44 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState onCreate={() => setShowCreate(true)} hasProjects={projects.length > 0} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          load();
        }}
      />
    </div>
  );
}

function ProjectCard({ project }) {
  const taskCount = project._count?.tasks || 0;
  const memberCount = project._count?.members || 0;
  return (
    <Link
      to={`/projects/${project.id}`}
      className="card p-5 hover:shadow-soft hover:border-brand-200 transition group block"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-lg shadow-md">
          {project.name.charAt(0).toUpperCase()}
        </div>
        <span className="text-xs text-slate-400">{formatDate(project.createdAt)}</span>
      </div>
      <h3 className="font-bold text-slate-900 text-lg group-hover:text-brand-700 transition">
        {project.name}
      </h3>
      <p className="text-sm text-slate-500 mt-1 line-clamp-2 min-h-[2.5rem]">
        {project.description || 'No description provided.'}
      </p>
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4 text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5h6a2 2 0 0 1 2 2v12l-5-3-5 3V7a2 2 0 0 1 2-2z"/>
            </svg>
            {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 0 0-3-3.87M9 20H4v-2a4 4 0 0 1 3-3.87m10-3.13a4 4 0 1 0-8 0 4 4 0 0 0 8 0z"/>
            </svg>
            {memberCount}
          </span>
        </div>
        <div className="flex -space-x-2">
          {(project.members || []).slice(0, 4).map((m) => (
            <div
              key={m.id}
              title={m.user.name}
              className="w-6 h-6 rounded-full bg-brand-100 border-2 border-white text-brand-700 text-[10px] font-bold flex items-center justify-center"
            >
              {m.user.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {(project.members || []).length > 4 && (
            <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white text-slate-700 text-[9px] font-bold flex items-center justify-center">
              +{project.members.length - 4}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ onCreate, hasProjects }) {
  return (
    <div className="card text-center py-16 px-6">
      <div className="w-16 h-16 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        </svg>
      </div>
      <h3 className="text-lg font-bold text-slate-900">
        {hasProjects ? 'No matches found' : 'No projects yet'}
      </h3>
      <p className="text-slate-500 mt-1">
        {hasProjects ? 'Try a different search term.' : 'Create your first project to get started.'}
      </p>
      {!hasProjects && (
        <button onClick={onCreate} className="btn-primary mt-6">
          Create your first project
        </button>
      )}
    </div>
  );
}

function CreateProjectModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await client.post('/projects', form);
      toast.success('Project created!');
      setForm({ name: '', description: '' });
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create new project">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Project name *</label>
          <input
            type="text"
            required
            minLength={2}
            autoFocus
            className="input"
            placeholder="e.g. Q4 Marketing Plan"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            className="input min-h-[100px] resize-y"
            placeholder="What's this project about?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Creating…' : 'Create project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
