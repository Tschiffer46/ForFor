import { Organization, Product, Club, LagGroup, Team, District, Street, Address, Customer, Campaign, Order, OrderItem, User } from '@prisma/client'

export type OrganizationWithRelations = Organization & {
  clubs?: Club[]
  products?: Product[]
}

export type ClubWithRelations = Club & {
  lagGroups?: LagGroup[]
  campaigns?: Campaign[]
}

export type LagGroupWithRelations = LagGroup & {
  teams?: Team[]
}

export type TeamWithRelations = Team & {
  districts?: District[]
  users?: User[]
}

export type DistrictWithRelations = District & {
  streets?: Street[]
}

export type StreetWithRelations = Street & {
  addresses?: Address[]
}

export type OrderWithRelations = Order & {
  customer?: Customer
  seller?: User
  campaign?: Campaign
  team?: Team
  orderItems?: (OrderItem & { product?: Product })[]
}

export type CustomerWithRelations = Customer & {
  address?: Address
  orders?: Order[]
}
