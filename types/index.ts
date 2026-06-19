export type Lang = 'en' | 'ar'
export type CustomerType = 'individual' | 'organization'
export type DeliveryType = 'delivery' | 'pickup'
export type OrderStatus = 'new' | 'reviewing' | 'in_production' | 'ready' | 'delivered' | 'cancelled'

export interface FormData {
  language: Lang
  customerType: CustomerType | ''
  firstName: string
  lastName: string
  orgName: string
  email: string
  phone: string
  orderDesc: string
  files: File[]
  fileUrls: string[]
  wantMeeting: boolean
  meetingNote: string
  deliveryType: DeliveryType | ''
  city: string
  country: string
  address: string
  preferredDate: string
  paymentMethod: string
  agreedToTerms: boolean
}

export interface InvoiceItem {
  id: string
  description: string
  qty: number
  unitPrice: number
}

export interface Order {
  id: string
  refNumber: string
  language: string
  customerType: string
  firstName: string
  lastName: string
  orgName: string | null
  email: string
  phone: string
  city: string
  country: string
  address: string
  orderDesc: string
  fileUrls: string[]
  wantMeeting: boolean
  meetingNote: string | null
  deliveryType: string
  preferredDate: string
  paymentMethod: string
  status: string
  invoiceItems: InvoiceItem[] | null
  deliveryCost: number | null
  discount: number | null
  notes: string | null
  invoiceNumber: string | null
  createdAt: string
  updatedAt: string
}
