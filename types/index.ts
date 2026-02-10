import { Forening, Produkt, Lag, Gata, Adress, Kund, Saljrunda, Order, OrderRad, Anvandare } from '@prisma/client'

export type ForeningWithRelations = Forening & {
  teams?: Lag[]
  products?: Produkt[]
  orderRounds?: Saljrunda[]
}

export type LagWithRelations = Lag & {
  streets?: Gata[]
  teamMembers?: Anvandare[]
}

export type GataWithRelations = Gata & {
  addresses?: Adress[]
}

export type OrderWithRelations = Order & {
  kund?: Kund
  saljare?: Anvandare
  saljrunda?: Saljrunda
  orderItems?: (OrderRad & { produkt?: Produkt })[]
}

export type KundWithRelations = Kund & {
  adress?: Adress
  orders?: Order[]
}
