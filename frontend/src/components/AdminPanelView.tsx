import React, { useState, useEffect } from 'react';
import { Users, Tag, Plus, Trash2, RefreshCw, CheckCircle2, AlertCircle, Cpu } from 'lucide-react';
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
      
      {/* Admin Header - WattVision Theme */}
      <div className="watt-card relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-brand-cyan/5 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            System Administration &amp; Control Panel
          </h1>
          <p className="text-sm text-brand-gray mt-1 max-w-2xl">
            Manage system accounts, custom research categories, and model execution pipelines.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Dynamic Category Management (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="watt-card space-y-5">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Tag className="w-4 h-4 text-brand-cyan" />
                <span>Dynamic Research Categorization Engine</span>
              </h2>
              <p className="text-xs text-brand-gray mt-0.5">
                Introduce new categories as college research evolves to accommodate emerging data sets.
              </p>
            </div>

            {catError && (
              <div className="watt-alert shadow-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{catError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCategory} className="space-y-4 pt-2 border-t border-brand-border">
              <div>
                <label className="block text-xs font-medium text-brand-gray mb-1">New Category Name</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g., Space Robotics, Astrobiology, 7G Networks..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-white text-xs focus:outline-none focus:border-brand-cyan"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-gray mb-1">Description / Keywords Hint</label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Brief description of this research area..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-bg border border-brand-border text-white text-xs focus:outline-none focus:border-brand-cyan"
                />
              </div>

              <button
                type="submit"
                disabled={catCreating}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan/80 text-brand-bg font-bold text-xs shadow-lg hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-brand-bg stroke-[3]" />
                <span>{catCreating ? 'Adding Category...' : 'Dynamically Introduce Category'}</span>
              </button>
            </form>

            {/* List of Custom & Default Categories */}
            <div className="pt-4 border-t border-brand-border">
              <span className="text-xs font-semibold text-brand-gray block mb-3">Active System Categories ({categories.length}):</span>
              <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-2.5 rounded-xl bg-brand-bg border border-brand-border text-xs">
                    <div>
                      <span className="font-semibold text-white flex items-center space-x-1.5">
                        <span>#{cat.name}</span>
                        {cat.is_custom && (
                          <span className="px-1.5 py-0.2 rounded bg-brand-red/20 text-brand-red text-[9px] font-bold uppercase border border-brand-red/30">
                            Custom
                          </span>
                        )}
                      </span>
                      {cat.description && <span className="text-brand-gray text-[11px] block mt-0.5">{cat.description}</span>}
                    </div>
                    {cat.is_custom && (
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1.5 rounded-lg text-brand-gray hover:text-brand-red hover:bg-brand-red/10 transition-colors cursor-pointer"
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
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-brand-cyan" />
                <span>Classification Engine Control</span>
              </h2>
              <p className="text-xs text-brand-gray mt-0.5">
                Retrain categorization and relevance predictors on current database publications.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-brand-bg border border-brand-border space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-brand-gray">Relevance Filter:</span>
                <span className="text-brand-green font-bold flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-brand-gray">Department Predictor:</span>
                <span className="text-brand-green font-bold flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-brand-gray">Text Summarizer:</span>
                <span className="text-brand-cyan font-bold">Active</span>
              </div>
            </div>

            {retrainMsg && (
              <div className="bg-brand-green/10 text-brand-green border-l-4 border-brand-green p-4 rounded-r-lg shadow-lg flex items-center space-x-2 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{retrainMsg}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleRetrainMl}
              disabled={retraining}
              className="w-full py-3 rounded-xl bg-brand-bg hover:bg-brand-hover text-white font-bold text-xs border border-brand-border shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-brand-cyan ${retraining ? 'animate-spin' : ''}`} />
              <span>{retraining ? 'Retraining Models on Database Corpus...' : 'Retrain Scikit-Learn ML Models Now'}</span>
            </button>
          </div>

          {/* User Management Table */}
          <div className="watt-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <Users className="w-4 h-4 text-brand-cyan" />
                  <span>Registered College Users & Roles</span>
                </h2>
                <p className="text-xs text-brand-gray mt-0.5">
                  RBAC overview of faculty and administrative staff accounts
                </p>
              </div>
              <button
                onClick={fetchUsers}
                className="p-2 rounded-xl bg-brand-bg text-brand-gray hover:text-white border border-brand-border cursor-pointer"
                title="Refresh Users"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-brand-border text-brand-gray uppercase font-semibold text-[10px]">
                    <th className="py-2.5 px-3">Name & Email</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border text-white">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-brand-hover transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-white block">{u.full_name}</span>
                        <span className="text-[11px] text-brand-gray">{u.email}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          u.role === 'admin' ? 'bg-brand-red/20 text-brand-red border-brand-red/30' : 'bg-brand-green/20 text-brand-green border-brand-green/30'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-brand-gray">{u.department}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-brand-green/20 text-brand-green text-[10px] font-bold uppercase border border-brand-green/30">
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
