// utils/resetAllJotaiAtoms.jsx
import {
    accessTokenAtom,
    userInfoAtom,
    clearAuthState,
  } from '@/jotai/authAtoms'
  import {
    loadingAtom,
    errorAtom,
    stompConnectedAtom,
    stompErrorAtom,
    chatRoomsAtom,
    activeChatRoomAtom,
    messagesAtom,
    unreadCountsAtom,
    serversAtom,
    discordChannelsAtom,
    activeChannelAtom,
    activeCategoryAtom,
    isLoadingMessagesAtom,
  } from '@/jotai/chatAtoms'
  import {
    notiListAtom,
    hasNewNotiAtom,
    notiCountAtom,
  } from '@/jotai/notiAtoms'
  import { useSetAtom } from 'jotai'
  import { useQueryClient } from '@tanstack/react-query'
  
  export const useResetAllAtoms = () => {
    const queryClient = useQueryClient()
  
    // ✅ 각 atom 수동 초기화용 setter
    const setAccessToken = useSetAtom(accessTokenAtom)
    const setUserInfo = useSetAtom(userInfoAtom)
  
    const setLoading = useSetAtom(loadingAtom)
    const setError = useSetAtom(errorAtom)
    const setStompConnected = useSetAtom(stompConnectedAtom)
    const setStompError = useSetAtom(stompErrorAtom)
    const setChatRooms = useSetAtom(chatRoomsAtom)
    const setActiveChatRoom = useSetAtom(activeChatRoomAtom)
    const setMessages = useSetAtom(messagesAtom)
    const setUnreadCounts = useSetAtom(unreadCountsAtom)
    const setServers = useSetAtom(serversAtom)
    const setDiscordChannels = useSetAtom(discordChannelsAtom)
    const setActiveChannel = useSetAtom(activeChannelAtom)
    const setActiveCategory = useSetAtom(activeCategoryAtom)
    const setIsLoadingMessages = useSetAtom(isLoadingMessagesAtom)
  
    const setNotiList = useSetAtom(notiListAtom)
    const setHasNewNoti = useSetAtom(hasNewNotiAtom)
    const setNotiCount = useSetAtom(notiCountAtom)
  
    const resetAll = () => {
      // ✅ auth
      setAccessToken('')
      setUserInfo({
        userId: '',
        email: '',
        phone: '',
        name: '',
        image: '',
        createdAt: '',
        nickname: '',
        backgroundColor: '',
      })
      clearAuthState((atom, value) => {
        // 중복 방지
      }, queryClient)
  
      // ✅ chat
      setLoading(false)
      setError(null)
      setStompConnected(false)
      setStompError(null)
      setChatRooms([])
      setActiveChatRoom(null)
      setMessages([])
      setUnreadCounts({})
      setServers([])
      setDiscordChannels([])
      setActiveChannel(null)
      setActiveCategory(null)
      setIsLoadingMessages(false)
  
      // ✅ noti
      setNotiList([])
      setHasNewNoti(false)
      setNotiCount({})
    }
  
    return resetAll
  }
  