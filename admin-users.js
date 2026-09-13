import { _supabase } from './config.js';
import { usersDatabase, currentUser } from './state.js';

export async function deleteUserAccount(idx) {
  const targetUser = usersDatabase[idx];
  if (!targetUser) return;

  if (confirm(`⚠️ Delete ${targetUser.name} (${targetUser.email}) account?`)) {
    const { error } = await _supabase.from('pgf_users').delete().eq('email', targetUser.email);
    if (error) {
      alert("❌ Delete error: " + error.message);
      return;
    }

    const deletionTime = new Date().toLocaleDateString('en-IN') + " " + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    await _supabase.from('pgf_deleted_users_log').insert([{
      name: targetUser.name,
      email: targetUser.email,
      phone: targetUser.phone || 'N/A',
      deleted_on: deletionTime,
      deleted_by: currentUser ? currentUser.name : 'Admin'
    }]);

    usersDatabase.splice(idx, 1);
    if (typeof window.populateAdminDashboardTables === 'function') {
      window.populateAdminDashboardTables();
    }
    alert("✅ Account deleted successfully.");
  }
}