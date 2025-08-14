import { useQuery } from "@tanstack/react-query";
import { useAxios } from "./useAxios";
import { useAtomValue } from "jotai";
import { isAuthenticatedAtom } from "@/jotai/authAtoms";

interface Organization {
    id: string;
    name: string;
    address: string | null;
    description: string;
    tel: string | null;
    adminName: string;
    activated: boolean;
    imageId: string | null;
}

type MembershipStatus = "JOINED" | "PENDING" | "NOT_JOINED" | "REJECTED";

interface Program {
    id: number;
    programName: string;
    description: string;
}

interface OrganizationDetail extends Organization {
    website?: string;
    email?: string;
    foundedYear?: number;
    programs?: Program[];
    longDescription?: string;
    membershipStatus: MembershipStatus;
}

// 내가 가입한 기관 조회
export const useMyOrganizations = () => {
    const { fetchGet } = useAxios();
    const isAuthenticated = useAtomValue(isAuthenticatedAtom);

    return useQuery({
        queryKey: ["organizations", "my"],
        queryFn: async () => {
            const response = await fetchGet("/organizations/my");
            return response.data as Organization[];
        },
        select: (data) => {
            if (!data) {
                return [];
            }
            return data;
        },
        enabled: isAuthenticated // 로그인한 경우에만 API 호출
    });
};

// 추천 기관 조회
export const useRecommendedOrganizations = () => {
    const { fetchGet } = useAxios();

    return useQuery({
        queryKey: ["organizations", "recommended"],
        queryFn: async () => {
            const response = await fetchGet("/organizations/recommended");
            return response.data as Organization[];
        },
        select: (data) => {
            if (!data) {
                return [];
            }
            return data;
        }
    });
};

// 기관 상세 정보 조회
export const useOrganizationDetail = (organizationId: string) => {
    const { fetchGet } = useAxios();
    const { data: myOrganizations } = useMyOrganizations();
    const isAuthenticated = useAtomValue(isAuthenticatedAtom);

    return useQuery({
        queryKey: ["organizations", "detail", organizationId],
        queryFn: async () => {
            const response = await fetchGet(`/organizations/detail/${organizationId}`);
            // 로그인 상태가 아니면 isMember는 항상 false
            const isMember = isAuthenticated ? 
                myOrganizations?.some(org => org.id === organizationId) ?? false : 
                false;
            return { ...response.data, isMember } as OrganizationDetail & { isMember: boolean };
        },
        enabled: !!organizationId
    });
};

export const useOrganization = (organizationId: string) => {
    const { data: myOrganizations } = useMyOrganizations();
    const { fetchGet } = useAxios();
    const isAuthenticated = useAtomValue(isAuthenticatedAtom);
    
    return useQuery({
        queryKey: ['organization', organizationId],
        queryFn: async () => {
            const response = await fetchGet(`/organizations/detail/${organizationId}`);
            
            const membershipStatus = response.data?.membershipStatus;
            
            const isMember = 
                membershipStatus === 'JOINED' || 
                (isAuthenticated && myOrganizations?.some(org => org.id === organizationId));
            
            console.log('Organization membership check:', { 
                organizationId,
                membershipStatus,
                isAuthenticated,
                hasMyOrgs: !!myOrganizations,
                isMember
            });
            
            return { ...response.data, isMember: isMember === true };
        },
        enabled: !!organizationId,
        staleTime: 1000 * 60 * 5, // 5분 동안 데이터 캐싱
    });
};