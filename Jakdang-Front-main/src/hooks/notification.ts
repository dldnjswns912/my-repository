// hooks/useNotifications.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAxios } from "./useAxios";

// types/notification.ts
export interface NotificationItem {
    createdAt: string;
    updatedAt: string | null;
    id: number;
    title: string;
    message: string;
    type: 'CLASS' | 'ORGANIZATION' | 'SYSTEM';
    senderId: string;
    organizationId: string | null;
    classId: string | null;
    read: boolean;
}

export interface NotificationPage {
    pageable: {
        pageNumber: number;
        pageSize: number;
        sort: {
            empty: boolean;
            sorted: boolean;
            unsorted: boolean;
        };
        offset: number;
        paged: boolean;
        unpaged: boolean;
    };
    last: boolean;
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    sort: {
        empty: boolean;
        sorted: boolean;
        unsorted: boolean;
    };
    first: boolean;
    numberOfElements: number;
    empty: boolean;
    content: NotificationItem[];
}

export interface NotificationResponse {
    resultCode: number;
    resultMessage: string;
    data: NotificationPage;
}

interface UseNotificationsParams {
    page?: number;
    size?: number;
    sort?: string;
    enabled?: boolean;
}

export const useNotifications = ({
    page = 0,
    size = 10,
    sort = "createdAt,desc",
    enabled = false
}: UseNotificationsParams = {}) => {
    const { fetchGet } = useAxios();

    return useQuery({
        queryKey: ["notifications", { page, size, sort }],
        queryFn: async () => {
            const response = await fetchGet(
                `/notifications/all?page=${page}&size=${size}&sort=${sort}`
            );
            return response;
        }, enabled,
        select: (data: NotificationResponse) => {
            if (!data?.data) {
                return {
                    notifications: [],
                    pagination: {
                        currentPage: 0,
                        totalPages: 0,
                        totalElements: 0,
                        size: size,
                        isFirst: true,
                        isLast: true,
                    }
                };
            }

            return {
                notifications: data.data.content || [],
                pagination: {
                    currentPage: data.data.number,
                    totalPages: data.data.totalPages,
                    totalElements: data.data.totalElements,
                    size: data.data.size,
                    isFirst: data.data.first,
                    isLast: data.data.last,
                }
            };
        }
    });
};

export const useDeleteNotification = () => {
    const { fetchDelete } = useAxios();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (notificationId: number) => {
            return await fetchDelete(`/notifications/${notificationId}`);
        },
        onSuccess: () => {
            // 알림 목록 쿼리 무효화하여 자동으로 갱신
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
    });
};

export const useMarkNotificationAsRead = () => {
    const { fetchPatch } = useAxios();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (notificationId: number) => {
            return await fetchPatch(`/notifications/${notificationId}/read`);
        },
        onSuccess: () => {
            // 알림 목록 쿼리 무효화하여 자동으로 갱신
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
    });
};