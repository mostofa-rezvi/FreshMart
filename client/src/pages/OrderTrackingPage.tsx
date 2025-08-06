import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Updated import path
import * as orderApi from '../api/order';
import { Order, OrderStatus } from '../types';
import { socket } from '../utils/socket'; // Import the typed socket
import { formatCurrency, formatDate, getOrderStatusColor } from '../utils/helpers'; // Import helpers

const OrderTrackingPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>(); // Optional ID for single order
  const { user, isCustomer, isVendor, isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]); // For customer's list or admin/vendor view
  const [singleOrder, setSingleOrder] = useState<Order | null>(null); // For detailed view
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>("PENDING");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (id) {
        res = await orderApi.getOrderDetails(id);
        setSingleOrder(res.data);
        setSelectedStatus(res.data.status); // Set initial status for update form
      } else if (isCustomer) {
        res = await orderApi.getMyOrders();
        setOrders(res.data);
      } else if (isVendor) {
        res = await orderApi.getVendorOrders();
        setOrders(res.data);
      } else if (isAdmin) {
        res = await orderApi.getAllOrders();
        setOrders(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch orders.');
      // If fetching a single order fails (e.g., 403/404), redirect
      if (id) navigate('/my-orders'); // Redirect to general orders list
    } finally {
      setLoading(false);
    }
  }, [id, isCustomer, isVendor, isAdmin, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, fetchOrders]);

  // Socket.io for real-time updates
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket.connected) {
        socket.disconnect();
      }
      return;
    }

    socket.connect(); // Connect manually

    if (isCustomer && user.id) {
      socket.emit('joinCustomerRoom', user.id);
      socket.on('orderStatusUpdate', (data) => {
        console.log('Order status update received:', data);
        alert(`Order ${data.orderId.substring(0, 8)} status updated to: ${data.newStatus}`);
        fetchOrders(); // Re-fetch orders to show updated status
      });
    }

    if (isVendor && user.id) { // Join room using vendor's User ID
      socket.emit('joinVendorRoom', user.id);
      socket.on('newOrderNotification', (data) => {
        console.log('New order notification received:', data);
        alert(`New Order for your shop: ${data.message} (Order ID: ${data.orderId.substring(0, 8)})`);
        fetchOrders(); // Re-fetch vendor orders
      });
    }

    return () => {
      // Clean up on component unmount or user logout
      socket.off('orderStatusUpdate');
      socket.off('newOrderNotification');
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [isAuthenticated, isCustomer, isVendor, user, fetchOrders]);


  const handleUpdateStatus = async () => {
    if (!id || !singleOrder) return;
    setUpdatingStatus(true);
    try {
      await orderApi.updateOrderStatus(id, selectedStatus);
      alert('Order status updated successfully!');
      fetchOrders(); // Re-fetch to update local state
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update order status.');
    } finally {
      setUpdatingStatus(false);
    }
  };


  if (loading) return <div className="text-center py-10">Loading orders...</div>;
  if (error) return <div className="text-center py-10 text-red-500">Error: {error}</div>;
  if (!isAuthenticated) return <div className="text-center py-10 text-gray-500">Please login to view orders.</div>;

  // Single Order Details View
  if (id) {
    if (!singleOrder) return <div className="text-center py-10 text-gray-500">Order not found.</div>;
    return (
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Order Details - #{singleOrder.id.substring(0, 8)}</h1>
        <p className="text-gray-600 mb-2"><strong>Status:</strong> <span className={`font-semibold ${getOrderStatusColor(singleOrder.status)}`}>{singleOrder.status}</span></p>
        <p className="text-gray-600 mb-2"><strong>Total:</strong> {formatCurrency(singleOrder.totalAmount)}</p>
        <p className="text-gray-600 mb-2"><strong>Placed On:</strong> {formatDate(singleOrder.orderDate)}</p>
        <p className="text-gray-600 mb-2"><strong>Shipping To:</strong> {singleOrder.shippingAddress}</p>
        <p className="text-gray-600 mb-6"><strong>Contact:</strong> {singleOrder.contactPhone}</p>

        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Items</h2>
        <div className="space-y-4 mb-8">
          {singleOrder.orderItems.map(item => (
            <div key={item.id} className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center">
                <img src={item.product.imageUrl || 'https://via.placeholder.com/60?text=No+Img'} alt={item.product.name} className="w-16 h-16 object-cover rounded-md mr-4" />
                <div>
                  <p className="font-semibold text-gray-800">{item.product.name}</p>
                  <p className="text-gray-600 text-sm">Vendor: {item.product.vendor?.shopName || 'N/A'}</p>
                  <p className="text-gray-600 text-sm">Qty: {item.quantity}</p>
                </div>
              </div>
              <span className="font-semibold">{formatCurrency(item.priceAtOrder)}</span>
            </div>
          ))}
        </div>

        {(isVendor || isAdmin) && (
          <div className="mt-8 border-t pt-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Update Order Status</h2>
            <div className="flex items-center space-x-4">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                className="p-2 border border-gray-300 rounded-md"
              >
                {Object.values(OrderStatus).map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <button
                onClick={handleUpdateStatus}
                disabled={updatingStatus}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {updatingStatus ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // List of Orders View
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        {isCustomer ? "My Orders" : isVendor ? "Vendor Orders" : "All Orders (Admin)"}
      </h1>

      {orders.length === 0 ? (
        <div className="text-center bg-gray-100 p-8 rounded-lg shadow-md">
          <p className="text-xl text-gray-600 mb-4">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Order #{order.id.substring(0, 8)}</h3>
                  <p className="text-gray-600">Total: {formatCurrency(order.totalAmount)}</p>
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700 text-sm">
                <div>
                  <p><strong>Date:</strong> {formatDate(order.orderDate)}</p>
                  <p><strong>Customer:</strong> {order.customer?.email || 'N/A'}</p>
                </div>
                <div>
                  <p><strong>Items:</strong> {order.orderItems.length}</p>
                  <p><strong>Payment:</strong> {order.paymentStatus}</p>
                </div>
              </div>
              <div className="mt-4 text-right">
                <button
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderTrackingPage;