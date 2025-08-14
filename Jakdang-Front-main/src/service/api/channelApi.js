import { useAxiosQuery } from '@/hooks/useAxiosQuery';
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useChannelApi = () => {
  const { useGet, usePost, usePut, useDelete } = useAxiosQuery();
  const queryClient = useQueryClient();

  const allChannelsQuery = useGet(['channels', 'all'], '/channel/all');
  
  const activeChannelsQuery = useGet(['channels', 'active'], '/channel/active');
  
/*   const createChannelMutation = usePost({
    onSuccess: () => {
      queryClient.invalidateQueries(['channels']);
    }
  });

  const updateChannelMutation = usePut({
    onSuccess: () => {
      queryClient.invalidateQueries(['channels']);
    }
  });

  const deactivateChannelMutation = usePost({
    onSuccess: () => {
      queryClient.invalidateQueries(['channels']);
    }
  });

  const activeChannelMutation = usePost({
    onSuccess: () => {
      queryClient.invalidateQueries(['channels']);
    }
  });

  const createChannel = useCallback((channelData) => {
    return createChannelMutation.mutateAsync({
      endPoint: '/channel/admin',
      data: channelData
    });
  }, [createChannelMutation]);

  const updateChannel = useCallback((channelData) => {
    return updateChannelMutation.mutateAsync({
      endPoint: '/channel/update',
      data: channelData
    });
  }, [updateChannelMutation]);

  const deactivateChannel = useCallback((channelId) => {
    return deactivateChannelMutation.mutateAsync({
      endPoint: `/channel/deactivate/${channelId}`
    });
  }, [deactivateChannelMutation]);

  const activeChannel = useCallback((channelId) => {
    return activeChannelMutation.mutateAsync({
      endPoint: `/channel/active/${channelId}`
    });
  }, [activeChannelMutation]); */

  return {
    allChannelsQuery,
    activeChannelsQuery,
/*     createChannel,
    updateChannel,
    activeChannel,
    deactivateChannel,
    isCreating: createChannelMutation.isLoading,
    isUpdating: updateChannelMutation.isLoading,
    isDeactivating: deactivateChannelMutation.isLoading */
  };
};