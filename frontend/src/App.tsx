import { BrowserRouter, Routes, Route, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import OrderList from './pages/OrderList';
import OrderDetail from './pages/OrderDetail';
import OrderCreate from './pages/OrderCreate';
import MessageCenter from './pages/MessageCenter';

// 模拟用户ID（实际应用中应从登录状态获取）
const DEMO_USER_ID = 'demo-user-001';

// 订单列表页面包装器
function OrderListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const martId = searchParams.get('martId') || undefined;

  return (
    <div>
      <div className="bg-white border-b p-4 sticky top-0 z-20">
        <h1 className="text-lg font-medium text-center">我的订单</h1>
      </div>
      <OrderList
        userId={DEMO_USER_ID}
        martId={martId}
        onSelectOrder={(order) => navigate(`/orders/${order.id}`)}
      />
    </div>
  );
}

// 订单详情页面包装器
function OrderDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  if (!id) return <div>订单ID不存在</div>;

  return (
    <OrderDetail
      orderId={id}
      onBack={() => navigate('/orders')}
    />
  );
}

// 创建订单页面包装器
function OrderCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const martId = searchParams.get('martId') || 'demo-mart-001';

  return (
    <OrderCreate
      martId={martId}
      userId={DEMO_USER_ID}
      onSuccess={(orderId) => {
        navigate(`/orders/${orderId}`);
      }}
      onCancel={() => navigate('/orders')}
    />
  );
}

// 消息中心页面包装器
function MessageCenterPage() {
  return (
    <div>
      <div className="bg-white border-b p-4 sticky top-0 z-20">
        <h1 className="text-lg font-medium text-center">消息中心</h1>
      </div>
      <MessageCenter userId={DEMO_USER_ID} />
    </div>
  );
}

// 首页
function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary-500 text-white p-8 text-center">
        <h1 className="text-2xl font-bold">VanMart</h1>
        <p className="text-sm opacity-80 mt-1">接龙团购平台</p>
      </div>

      <div className="p-4 space-y-3">
        <button
          onClick={() => navigate('/orders/create?martId=demo-mart-001')}
          className="w-full p-4 bg-white rounded-lg shadow-sm text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">创建订单</h3>
              <p className="text-sm text-gray-500 mt-1">参与接龙活动，下单购买商品</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        <button
          onClick={() => navigate('/orders')}
          className="w-full p-4 bg-white rounded-lg shadow-sm text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">我的订单</h3>
              <p className="text-sm text-gray-500 mt-1">查看订单列表和详情</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        <button
          onClick={() => navigate('/messages')}
          className="w-full p-4 bg-white rounded-lg shadow-sm text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">消息中心</h3>
              <p className="text-sm text-gray-500 mt-1">查看系统通知和消息</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>

      <div className="p-4 mt-4">
        <div className="bg-white rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">MVP 功能说明</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• 订单创建：选择商品、填写收货地址、提交订单</li>
            <li>• 订单列表：分页显示、状态筛选</li>
            <li>• 订单详情：查看商品、物流、操作订单</li>
            <li>• 消息中心：系统通知、订单消息</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/orders" element={<OrderListPage />} />
          <Route path="/orders/create" element={<OrderCreatePage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/messages" element={<MessageCenterPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
