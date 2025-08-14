import { useAxios } from "./useAxios"
import {useToast} from "@/components/ui/use-toast.ts";


interface OrganizationRequestData {
  name: string
  description: string
  location: string
  phone: string
  businessNumber: string
  type: string
  website?: string
  logo?: string
  applicantRole: string
}

export const useOrganizationRequest = () => {
  const { fetchPost } = useAxios()
  const { toast } = useToast()

  const requestOrganization = async (data: OrganizationRequestData) => {
    try {
      const response = await fetchPost("/organizations/request", data)
      
      toast({
        title: "기관 등록 신청 완료",
        description: "기관 등록 신청이 완료되었습니다. 승인을 기다려주세요.",
      })

      return response
    } catch (error: any) {
      toast({
        title: "기관 등록 신청 실패",
        description: error.message || "기관 등록 신청 중 오류가 발생했습니다.",
        variant: "destructive",
      })
      throw error
    }
  }

  return { requestOrganization }
} 