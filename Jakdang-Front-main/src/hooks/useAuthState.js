export const useAuthStatus = () => {
    const accessToken = useAtomValue(accessTokenAtom);
    const isAuthenticated = !!accessToken;
  
    return useQuery({
      queryKey: AUTH_QUERY_KEYS.AUTH_STATUS,
      queryFn: async () => {
        return isAuthenticated;
      },
      initialData: isAuthenticated,
      staleTime: Infinity, // 명시적으로 무효화하기 전까지 데이터 유지
    });
  };