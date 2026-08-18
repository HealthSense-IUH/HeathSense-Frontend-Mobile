import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loginApi, registerApi, logoutApi } from '@/services/authentication';
import { useAuthStore } from '@/services/authentication/authStore';
import { LoginRequest, RegisterRequest } from '@/types/authentication';

export const useLoginMutation = () => {
  const setUser = useAuthStore((state) => state.setUser);
  return useMutation({
    mutationFn: (data: LoginRequest) => loginApi(data),
    onSuccess: (res) => {
      if (res.userSession) {
        setUser(res.userSession);
      }
    },
  });
};

export const useRegisterMutation = () => {
  return useMutation({
    mutationFn: (data: RegisterRequest) => registerApi(data),
  });
};

export const useLogoutMutation = () => {
  const clearUser = useAuthStore((state) => state.clearUser);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => logoutApi(),
    onSuccess: () => {
      clearUser();
      queryClient.clear(); // Clear all react-query cache on logout
    },
    onError: () => {
      // Even if API fails, clear local session to force logout
      clearUser();
      queryClient.clear();
    }
  });
};
