"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useNotifications, useDeleteNotification, useMarkNotificationAsRead } from "@/hooks/notification"
import {useState, useMemo, useEffect} from "react"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { notiCountAtom } from "@/jotai/notiAtoms"
import { useAtom } from "jotai"
import { usePostApi } from "@/service/api/postApi"
import ChannelDetailModal from "@/components/modal/detail-modal/channel-detail-modal"

export default function NotificationPanel({ isOpen, onOpenChange }) {
    const [activeTab, setActiveTab] = useState(0)
    const { data, isLoading } = useNotifications({ enabled: isOpen})
    const { mutate: deleteNotification } = useDeleteNotification()
    const { mutate: markAsRead } = useMarkNotificationAsRead()
    const [_, setNotiCountAtom] = useAtom(notiCountAtom)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [selectedPostId, setSelectedPostId] = useState(null)
    const { usePostDetail, likePost, bookmarkPost } = usePostApi()
    const [selectedPost, setSelectedPost] = useState(null)
    const { userInfo } = usePostApi()

    // 게시물 상세 정보 조회
    const { data: postDetailData } = usePostDetail(selectedPostId, {
        enabled: Boolean(selectedPostId),
        onSuccess: (data) => {
            console.log('상세 게시물 불러옴:', data)
            if (data?.data) {
                setIsDetailModalOpen(true)
            }
        }
    })

    useEffect(() => {
        if (postDetailData?.data) {
            setIsDetailModalOpen(true)
        }
    }, [postDetailData])


    // 읽지 않은 알림 개수 계산
    const unreadCount = useMemo(() => {
        const counts = data?.notifications.filter(notification => !notification.read).length || 0
        setNotiCountAtom(counts)
        return counts
    }, [data?.notifications])

    // 탭에 따른 알림 필터링
    const filteredNotifications = useMemo(() => {
        if (!data?.notifications) return []
        return activeTab === 0 
            ? data.notifications
            : data.notifications.filter(notification => !notification.read)
    }, [data?.notifications, activeTab])

    const handleDelete = (notificationId) => {
        deleteNotification(notificationId)
    }

    const handleMarkAsRead = (notificationId) => {
        markAsRead(notificationId)
        setNotiCountAtom((prev) => prev - 1)
    }

    const handleMarkAllAsRead = () => {
        data?.notifications
            .filter(notification => !notification.read)
            .forEach(notification => {
                markAsRead(notification.id)
                setNotiCountAtom((prev) => prev - 1)
            })
    }

    const handleNotificationClick = (notification) => {
        if (notification.action.resourceId) {
            setSelectedPostId(notification.action.resourceId)
        }
    }

    const handleLikeClick = async (postId) => {
        try {
            const res = await likePost(postId, userInfo.userId)
            if (res.result) {
                setSelectedPost((prev) =>
                    prev?.id === postId
                        ? {
                            ...prev,
                            is_like: !prev.is_like,
                            like_count: prev.is_like
                                ? prev.like_count - 1
                                : prev.like_count + 1,
                        }
                        : prev
                )
            }
            return res
        } catch (error) {
            console.error(error)
            throw error
        }
    }

    const handleBookmarkClick = async (postId) => {
        try {
            const res = await bookmarkPost(postId, userInfo.userId)
            if (res.result) {
                setSelectedPost((prev) =>
                    prev?.id === postId
                        ? {
                            ...prev,
                            is_bookmark: !prev.is_bookmark,
                        }
                        : prev
                )
            }
            return res
        } catch (error) {
            console.error(error)
            throw error
        }
    }

    return (
        <>
            <Sheet open={isOpen} onOpenChange={onOpenChange}>
                <SheetContent side="right" className="w-full sm:max-w-md p-0 border-l z-80">
                    <div className="flex flex-col h-full">
                        <div className="px-6 py-4 border-b pr-12">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold dark:text-white">알림</h2>
                                {unreadCount > 0 && (
                                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* 탭 */}
                        <div className="px-6 py-3 border-b">
                            <div className="flex space-x-4">
                                {[
                                    { name: "전체", count: data?.notifications?.length || 0 },
                                    { name: "읽지 않음", count: unreadCount }
                                ].map((tab, index) => (
                                    <button
                                        key={tab.name}
                                        onClick={() => setActiveTab(index)}
                                        className={`py-1 text-sm cursor-pointer font-medium border-b-2 transition-colors flex items-center gap-2 ${
                                            index === activeTab
                                                ? "border-navy-600 text-navy-700 dark:text-white dark:border-navy-400"
                                                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                        }`}
                                    >
                                        {tab.name}
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                            index === activeTab
                                                ? "bg-navy-100 text-navy-700 dark:bg-navy-700 dark:text-white"
                                                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                        }`}>
                                            {tab.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 알림 목록 */}
                        <div className="flex-1 overflow-y-auto">
                            {isLoading ? (
                                <div className="px-6 py-4 text-center text-gray-500">로딩 중...</div>
                            ) : filteredNotifications.length === 0 ? (
                                <div className="px-6 py-4 text-center text-gray-500">
                                    {activeTab === 0 ? "알림이 없습니다." : "읽지 않은 알림이 없습니다."}
                                </div>
                            ) : (
                                filteredNotifications.map((notification) => (
                                    <div 
                                        key={notification.id}
                                        className={`px-6 py-3 border-b transition-colors cursor-pointer ${
                                            notification.read 
                                                ? "bg-white dark:bg-navy-800 hover:bg-gray-50 dark:hover:bg-navy-800/50"
                                                : "bg-blue-50 dark:bg-navy-800/30 hover:bg-blue-100 dark:hover:bg-navy-800/50"
                                        }`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="flex items-start gap-3">
                                            {!notification.read && (
                                                <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-red-500"></div>
                                            )}
                                            <div className="flex-1 min-w-0 pr-2">
                                                <div className="flex justify-between items-start gap-3">
                                                    <h3 className={`font-medium truncate max-w-[75%] ${
                                                        notification.read 
                                                            ? "text-gray-700 dark:text-gray-300"
                                                            : "text-navy-800 dark:text-white"
                                                    }`} title={notification.title}>
                                                        {notification.title}
                                                    </h3>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                                                        {formatDistanceToNow(new Date(notification.createdAt), {
                                                            addSuffix: true,
                                                            locale: ko
                                                        })}
                                                    </span>
                                                </div>
                                                <p className={`text-sm mt-1 ${
                                                    notification.read 
                                                        ? "text-gray-500 dark:text-gray-400"
                                                        : "text-gray-600 dark:text-gray-300"
                                                }`}>
                                                    {notification.message}
                                                </p>
                                                <div className="flex gap-2 mt-2">
                                                    {!notification.read && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMarkAsRead(notification.id);
                                                            }}
                                                        >
                                                            읽음
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(notification.id);
                                                        }}
                                                    >
                                                        삭제
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* 하단 액션 영역 */}
                        <div className="p-4 border-t">
                            <Button 
                                variant="outline" 
                                className="w-full cursor-pointer"
                                onClick={handleMarkAllAsRead}
                                disabled={!data?.notifications.some(notification => !notification.read)}
                            >
                                모두 읽음 표시
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            <ChannelDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false)
                    setSelectedPost(null)
                }}
                channelId={selectedPost?.channel_id}
                post={selectedPost}
                onLikeClick={handleLikeClick}
                onBookmarkClick={handleBookmarkClick}
            />
        </>
    )
}

