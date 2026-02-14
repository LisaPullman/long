const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// 订单API
export const ordersApi = {
  // 创建订单
  create: (data: {
    martId: string;
    userId?: string;
    receiverName: string;
    receiverPhone: string;
    province: string;
    city: string;
    district: string;
    detailAddress: string;
    buyerRemark?: string;
    items: { goodsId: string; quantity: number }[];
  }) => fetchApi<any>('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // 获取订单详情
  getById: (id: string) => fetchApi<any>(`/orders/${id}`),

  // 获取订单列表
  list: (params?: {
    page?: number;
    pageSize?: number;
    martId?: string;
    userId?: string;
    status?: string;
    orderNo?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    return fetchApi<any>(`/orders?${searchParams.toString()}`);
  },

  // 更新订单状态
  updateStatus: (id: string, data: {
    status: string;
    shippingCompany?: string;
    shippingNo?: string;
    cancelReason?: string;
    sellerRemark?: string;
  }) => fetchApi<any>(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
};

// 消息API
export const messagesApi = {
  // 发送消息
  send: (data: {
    userId: string;
    title: string;
    content?: string;
    type?: string;
    relatedId?: string;
  }) => fetchApi<any>('/messages', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // 获取消息列表
  list: (params: {
    userId: string;
    type?: string;
    isRead?: boolean;
    page?: number;
    pageSize?: number;
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    return fetchApi<any>(`/messages?${searchParams.toString()}`);
  },

  // 标记已读
  markRead: (id: string) => fetchApi<any>(`/messages/${id}/read`, {
    method: 'PATCH',
  }),

  // 批量标记已读
  markAllRead: (userId: string) => fetchApi<any>('/messages/read-all', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  }),
};

// 统计API
export const statsApi = {
  // Mart统计摘要
  getMartSummary: (martId: string) => fetchApi<any>(`/stats/mart/${martId}/summary`),

  // 用户订单统计
  getUserOrders: (userId: string) => fetchApi<any>(`/stats/user/orders?userId=${userId}`),
};

// Mart API
export const martsApi = {
  list: (params?: { status?: string; userId?: string; page?: number; pageSize?: number }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    return fetchApi<any>(`/marts?${searchParams.toString()}`);
  },

  getById: (id: string) => fetchApi<any>(`/marts/${id}`),

  create: (data: any) => fetchApi<any>('/marts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id: string, data: any) => fetchApi<any>(`/marts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  end: (id: string) => fetchApi<any>(`/marts/${id}/end`, { method: 'POST' }),

  close: (id: string) => fetchApi<any>(`/marts/${id}/close`, { method: 'POST' }),
};

// 商品API
export const goodsApi = {
  list: (params?: { martId?: string; categoryId?: string; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    return fetchApi<any>(`/goods?${searchParams.toString()}`);
  },

  getById: (id: string) => fetchApi<any>(`/goods/${id}`),

  like: (id: string, userId: string) => fetchApi<any>(`/goods/${id}/like`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  }),

  unlike: (id: string, userId: string) => fetchApi<any>(`/goods/${id}/like`, {
    method: 'DELETE',
    body: JSON.stringify({ userId }),
  }),
};

// 用户API
export const usersApi = {
  register: (data: { phone: string; password?: string; nickname?: string }) =>
    fetchApi<any>('/users/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { phone: string; password?: string }) =>
    fetchApi<any>('/users/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getById: (id: string) => fetchApi<any>(`/users/${id}`),

  update: (id: string, data: { nickname?: string; avatarUrl?: string }) =>
    fetchApi<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getAddresses: (userId: string) => fetchApi<any>(`/users/${userId}/addresses`),

  addAddress: (userId: string, data: any) =>
    fetchApi<any>(`/users/${userId}/addresses`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAddress: (userId: string, addressId: string, data: any) =>
    fetchApi<any>(`/users/${userId}/addresses/${addressId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteAddress: (userId: string, addressId: string) =>
    fetchApi<any>(`/users/${userId}/addresses/${addressId}`, {
      method: 'DELETE',
    }),
};
