import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isAuthenticated = !!user && !error;
  
  const logout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout', {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear the query cache and redirect
      queryClient.clear();
      window.location.href = '/login';
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
    logout
  };
}