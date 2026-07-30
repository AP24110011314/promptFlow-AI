import React, { useState, useEffect } from 'react';
import { Users, Tag, Plus, Trash2, RefreshCw, CheckCircle2, AlertCircle, Cpu, ShieldAlert } from 'lucide-react';
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
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="watt-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2.5">
            <ShieldAlert className="w-6 h-6 text-blue-600" />
            <span>Admin Control Panel &amp; ML Governance</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage system user roles, introduce new research category tags dynamically, and trigger model retraining.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-blue-600 font-bold uppercase tracking-wider text-[11px]">
            ADMIN PRIVILEGES GRANTED
          </span>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Dynamic Category Management (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="watt-card space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Tag className="w-4 h-4 text-blue-600" />
                <span>Dynamic Research Category Tags</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Introduce new categories as college research evolves to accommodate emerging data sets.
              </p>
            </div>

            {catError && (
              <div className="watt-alert shadow-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{catError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCategory} className="space-y-3 pt-2 border-t border-slate-200">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">New Category Name</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g., Space Robotics, Astrobiology, 7G Networks..."
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description / Keywords Hint</label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Brief description of this research area..."
                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              <button
                type="submit"
                disabled={catCreating}
                className="w-full watt-btn-primary"
              >
                <Plus className="w-4 h-4 text-white stroke-[2.5]" />
                <span>{catCreating ? 'Adding Category...' : 'Dynamically Introduce Category'}</span>
              </button>
            </form>

            {/* List of Custom & Default Categories */}
            <div className="pt-3 border-t border-slate-200">
              <span className="text-xs font-semibold text-slate-500 block mb-2.5">Active System Categories ({categories.length}):</span>
              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <span className="font-semibold text-slate-900 flex items-center space-x-1.5">
                        <span>#{cat.name}</span>
                        {cat.is_custom && (
                          <span className="text-[10px] font-semibold text-blue-600 font-mono">
                            Custom
                          </span>
                        )}
                      </span>
                      {cat.description && <span className="text-slate-500 text-[11px] block mt-0.5">{cat.description}</span>}
                    </div>
                    {cat.is_custom && (
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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
          <div className="watt-card space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span>Classification Engine Control</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Retrain categorization and relevance predictors on current database publications.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Relevance Filter:</span>
                <span className="text-emerald-600 font-semibold flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Department Predictor:</span>
                <span className="text-emerald-600 font-semibold flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Text Summarizer:</span>
                <span className="text-blue-600 font-semibold">Active</span>
              </div>
            </div>

            {retrainMsg && (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 rounded-lg flex items-center space-x-2 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{retrainMsg}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleRetrainMl}
              disabled={retraining}
              className="w-full watt-btn-secondary"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${retraining ? 'animate-spin' : ''}`} />
              <span>{retraining ? 'Retraining Models on Database Corpus...' : 'Retrain Scikit-Learn ML Models Now'}</span>
            </button>
          </div>

          {/* User Management Table */}
          <div className="watt-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Registered College Users &amp; Roles</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  RBAC overview of faculty and administrative staff accounts
                </p>
              </div>
              <button
                onClick={fetchUsers}
                className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200 cursor-pointer"
                title="Refresh Users"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
                    <th className="py-2.5 px-3">Name &amp; Email</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-900">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">{u.full_name}</span>
                        <span className="text-[11px] text-slate-500">{u.email}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="uppercase font-semibold text-slate-700 text-xs tracking-wider">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{u.department}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-emerald-600 text-xs">
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
