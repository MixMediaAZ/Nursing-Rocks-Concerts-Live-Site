import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { LogOut, Settings } from 'lucide-react';

export function FloatingAdminControl() {
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check if user is in admin mode
  useEffect(() => {
    const checkAdminStatus = () => {
      const adminStatus = localStorage.getItem("isAdmin") === "true";
      setIsAdmin(adminStatus);
    };
    
    // Initial check
    checkAdminStatus();
    
    // Listen for changes to admin status
    window.addEventListener('admin-mode-changed', checkAdminStatus);
    window.addEventListener('storage', checkAdminStatus);
    
    return () => {
      window.removeEventListener('admin-mode-changed', checkAdminStatus);
      window.removeEventListener('storage', checkAdminStatus);
    };
  }, []);

  // If not in admin mode, don't render anything
  if (!isAdmin) {
    return null;
  }

  const handleLogout = () => {
    // Perform admin logout
    fetch('/api/admin/logout', { method: 'POST' })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Logout request failed');
        }
        // Clear all admin-related local storage items
        localStorage.removeItem('adminToken');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('adminPinVerified');
        localStorage.removeItem('editMode');
        
        toast({
          title: 'Logged Out',
          description: 'You have been logged out of admin mode',
        });
        
        // Reload page to ensure all admin components are unmounted
        window.location.reload();
      })
      .catch(err => {
        console.error('Logout error:', err);
        toast({
          title: 'Logout Failed',
          description: 'There was an error logging out. Please try again.',
          variant: 'destructive',
        });
      });
  };

  const goToAdminDashboard = () => {
    window.location.href = '/admin';
  };

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-2">
      <Button
        variant="default"
        size="sm"
        className="bg-primary text-white shadow-lg border border-primary/30 rounded-full h-12 w-12 p-0"
        onClick={goToAdminDashboard}
        title="Admin Dashboard"
      >
        <Settings className="h-5 w-5" />
      </Button>
      
      <Button
        variant="destructive"
        size="sm"
        className="bg-red-500 hover:bg-red-600 text-white shadow-lg border border-red-400 rounded-full h-12 w-12 p-0"
        onClick={handleLogout}
        title="Logout from Admin"
      >
        <LogOut className="h-5 w-5" />
      </Button>
    </div>
  );
}