// 订单状态
export type OrderStatus =
  | 'CREATED'
  | 'PENDING_SHIPMENT'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELED';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  CREATED: '待处理',
  PENDING_SHIPMENT: '待发货',
  SHIPPED: '配送中',
  DELIVERED: '已送达',
  COMPLETED: '已完成',
  CANCELED: '已取消'
};

// Mart状态
export type MartStatus = 'OPEN' | 'CLOSED' | 'ENDED';

export const MART_STATUS_LABELS: Record<MartStatus, string> = {
  OPEN: '进行中',
  CLOSED: '已截单',
  ENDED: '已结束'
};

// 订单项
export interface OrderItem {
  id: string;
  goodsId: string | null;
  goodsName: string;
  goodsImage: string | null;
  specification: string | null;
  price: number;
  quantity: number;
  subtotal: number;
  goodsCost: number;
}

// 订单
export interface Order {
  id: string;
  orderNo: string;
  martId: string | null;
  userId: string | null;
  receiverName: string;
  receiverPhone: string;
  province: string;
  city: string;
  district: string;
  detailAddress: string;
  totalAmount: number;
  freightAmount: number;
  goodsCost: number;
  status: OrderStatus;
  shippingCompany: string | null;
  shippingNo: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  canceledAt: string | null;
  cancelReason: string | null;
  buyerRemark: string | null;
  sellerRemark: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  mart?: {
    id: string;
    topic: string;
  };
  user?: {
    id: string;
    nickname: string | null;
    phone: string | null;
  };
  deliveryTracks?: DeliveryTrack[];
}

// 物流跟踪
export interface DeliveryTrack {
  id: string;
  orderId: string;
  status: string;
  description: string | null;
  location: string | null;
  operator: string | null;
  createdAt: string;
}

// 消息
export interface Message {
  id: string;
  userId: string;
  title: string;
  content: string | null;
  type: string;
  relatedId: string | null;
  isRead: boolean;
  createdAt: string;
}

// Mart
export interface Mart {
  id: string;
  userId: string | null;
  topic: string;
  description: string | null;
  setFinishTime: boolean;
  finishTime: string | null;
  status: MartStatus;
  browseCount: number;
  isSingleProduct: boolean;
  groupSum: number | null;
  deliveryDescription: string | null;
  expectedShipDays: number;
  autoConfirmDays: number;
  createdAt: string;
  updatedAt: string;
  images?: MartImage[];
  goods?: Goods[];
  user?: {
    id: string;
    nickname: string | null;
    avatarUrl: string | null;
  };
}

export interface MartImage {
  id: string;
  martId: string;
  imageUrl: string;
  sortOrder: number;
}

// 商品
export interface Goods {
  id: string;
  martId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  specification: string | null;
  price: number;
  originalPrice: number | null;
  repertory: number;
  soldCount: number;
  isSetGroup: boolean;
  groupSum: number | null;
  lowStockThreshold: number | null;
  purchaseLimit: number | null;
  cost: number | null;
  likesCount: number;
  sortOrder: number;
  status: string;
  images?: GoodsImage[];
  category?: GoodsCategory;
}

export interface GoodsImage {
  id: string;
  goodsId: string;
  imageUrl: string;
  sortOrder: number;
}

export interface GoodsCategory {
  id: string;
  name: string;
  iconUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

// 用户
export interface User {
  id: string;
  phone: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

// 收货地址
export interface ShippingAddress {
  id: string;
  userId: string;
  receiverName: string;
  receiverPhone: string;
  province: string;
  provinceCode: string | null;
  city: string;
  cityCode: string | null;
  district: string;
  districtCode: string | null;
  detailAddress: string;
  latitude: number | null;
  longitude: number | null;
  tag: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// API响应
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
