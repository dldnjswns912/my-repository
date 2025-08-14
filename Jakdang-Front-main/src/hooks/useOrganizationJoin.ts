import { useAxios } from "./useAxios"

interface JoinRequestData {
  userId: string
  role: string
  reason: string
  userName: string
  phone: string
}

export const useOrganizationJoin = () => {
  const { fetchPost } = useAxios()

  const requestJoin = async (organizationId: string, data: JoinRequestData) => {
    const response = await fetchPost(`/organizations/${organizationId}/join`, data)
    return response
  }

  return { requestJoin }
} 