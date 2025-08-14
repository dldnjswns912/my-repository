export const useRefreshToken = () => {
    const queryClient = useQueryClient();
    const [, setAccessToken] = useAtom(setAccessTokenAtom);
  
    return useMutation({
      mutationFn: async () => {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        return response;
      },
      onSuccess: (response) => {
        const newToken = response.data.accessToken;
        setAccessToken(newToken);
        
        // 관련 쿼리 무효화 (새로운 토큰으로 다시 요청하도록)
        invalidateAuthQueries(queryClient);
      },
    });
  };