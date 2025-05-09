import { useQuery } from '@tanstack/react-query'
import { getAuthUser } from '../lib/api'

const useAuthUser = () => {
  const authUser = useQuery({
    queryKey: ['authUser'],
    queryFn: getAuthUser,
    retry: false,
    staleTime: 0,                // <-- siempre está "stale"
    refetchOnWindowFocus: true,  // <-- útil si vuelves a la pestaña
  });

  return {
    isLoading: authUser.isLoading,
    authUser: authUser.data?.user,
  };
}

export default useAuthUser;
