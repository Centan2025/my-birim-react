export const orderRankField = (config?: {type?: string; [key: string]: unknown}) => ({
  name: 'orderRank',
  title: 'Order Rank',
  type: 'string',
  hidden: true,
  ...config,
})

export const orderRankOrdering = {
  title: 'Ordered',
  name: 'ordered',
  by: [{field: 'orderRank', direction: 'asc'}],
}

export default {
  orderRankField,
  orderRankOrdering,
}
