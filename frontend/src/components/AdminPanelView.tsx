import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, Tag, Plus, Trash2, RefreshCw, CheckCircle2, AlertCircle, Cpu } from 'lucide-react';
import type { User, Category } from '../types';
import { adminService, categoryService } from '../services/api';

interface AdminPanelViewProps {
  categories: Category[];
  onRefreshCategories: () => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  categories,
  onRefreshCategories,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Custom Category State
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [catCreating, setCatCreating] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  // ML Retraining State
  const [retraining, setRetraining] = useState(false);
  const [retrainMsg, setRetrainMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await adminService.listUsers();
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCatCreating(true);
    setCatError(null);
    try {
      await categoryService.createCustom(newCatName.trim(), newCatDesc.trim());
      setNewCatName('');
      setNewCatDesc('');
      onRefreshCategories();
    } catch (err: any) {
      setCatError(err.response?.data?.detail || "Error creating category.");
    } finally {
      setCatCreating(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm("Remove this research category tag?")) return;
    try {
      await categoryService.delete(id);
      onRefreshCategories();
    } catch (err) {
      alert("Error deleting category.");
    }
  };

  const handleRetrainMl = async () => {
    setRetraining(true);
    setRetrainMsg(null);
    try {
      const res = await adminService.retrainMl();
      setRetrainMsg(res.message || "Scikit-learn classification models retrained successfully.");
    } catch (err) {
      setRetrainMsg("Error retraining scikit-learn models.");
    } finally {
      setRetraining(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Admin Header */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-amber-500/30 relative overflow-hidden bg-gradient-to-r from-amber-950/20 via-slate-900/80 to-slate-900">
        <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-3">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Role-Based Access Control (RBAC) • Administrator Privileges</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            System Administration & ML Control Panel
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Manage system user accounts, dynamically introduce custom research categorization tags as academic domains evolve, and trigger retraining of scikit-learn classification models.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Dynamic Category Management (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-slate-800/80 space-y-5">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Tag className="w-4 h-4 text-cyan-400" />
                <span>Dynamic Research Categorization Engine</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Introduce new categories as college research evolves to accommodate emerging data sets.
              </p>
            </div>

            {catError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{catError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCategory} className="space-y-4 pt-2 border-t border-slate-800/80">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New Category Name</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g., Space Robotics, Astrobiology, 7G Networks..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description / Keywords Hint</label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Brief description of this research area..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={catCreating}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-bold text-xs shadow-lg hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>{catCreating ? 'Adding Category...' : 'Dynamically Introduce Category'}</span>
              </button>
            </form>

            {/* List of Custom & Default Categories */}
            <div className="pt-4 border-t border-slate-800/80">
              <span className="text-xs font-semibold text-slate-400 block mb-3">Active System Categories ({categories.length}):</span>
              <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
                    <div>
                      <span className="font-semibold text-white flex items-center space-x-1.5">
                        <span>#{cat.name}</span>
                        {cat.is_custom && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold uppercase">
                            Custom
                          </span>
                        )}
                      </span>
                      {cat.description && <span className="text-slate-500 text-[11px] block mt-0.5">{cat.description}</span>}
                    </div>
                    {cat.is_custom && (
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Remove custom category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Machine Learning Engine Control & User Mgmt (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* ML Model Retrain Card */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800/80 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>Scikit-Learn ML Model Diagnostics & Re-indexing</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Retrain the Naive Bayes email relevance classifier and Random Forest department predictor on updated corpus data.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Email Relevance Pipeline:</span>
                <span className="text-emerald-400 font-bold flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active (TF-IDF + Multinomial NB)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Department Predictor Pipeline:</span>
                <span className="text-emerald-400 font-bold flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active (TF-IDF + Random Forest)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Extractive Summarization:</span>
                <span className="text-cyan-400 font-bold">Active (TF-IDF Sentence Ranking)</span>
              </div>
            </div>

            {retrainMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{retrainMsg}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleRetrainMl}
              disabled={retraining}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700/80 shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-400 ${retraining ? 'animate-spin' : ''}`} />
              <span>{retraining ? 'Retraining Models on Database Corpus...' : 'Retrain Scikit-Learn ML Models Now'}</span>
            </button>
          </div>

          {/* User Management Table */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Registered College Users & Roles</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  RBAC overview of faculty and administrative staff accounts
                </p>
              </div>
              <button
                onClick={fetchUsers}
                className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white"
                title="Refresh Users"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400 uppercase font-semibold text-[10px]">
                    <th className="py-2.5 px-3">Name & Email</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-white block">{u.full_name}</span>
                        <span className="text-[11px] text-slate-400">{u.email}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{u.department}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
