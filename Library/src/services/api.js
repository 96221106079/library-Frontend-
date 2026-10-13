// ============================================
// API Service - Centralized Axios Instance
// ============================================

import axios from "axios";

const API_BASE_URL = "https://smart-hybrid-library-backend.vercel.app/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Only redirect to login if not already there
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  googleLogin: (data) => api.post("/auth/google", data),
  register: (data) => api.post("/auth/register", data),
  profile: () => api.get("/auth/profile"),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const userAPI = {
  updateLocation: (data) => api.put("/users/location", data),
  getAll: () => api.get("/users"),
  getProfile: () => api.get("/users/profile"),
};

// ── Books ─────────────────────────────────────────────────────────────────────
export const booksAPI = {
  getAll: () => api.get("/books"),
  getNearby: (lat, lng, radius = 5) =>
    api.get(`/books/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
  getNearbyUsers: (lat, lng, radius = 5) =>
    api.get(`/books/nearby-users?lat=${lat}&lng=${lng}&radius=${radius}`),
  getNearbyLibraries: (lat, lng, radius = 5) =>
    api.get(`/books/nearby-libraries?lat=${lat}&lng=${lng}&radius=${radius}`),
  getMyBooks: () => api.get("/books/my-books"),
  getActivity: () => api.get("/books/activity"),
  getById: (id) => api.get(`/books/${id}`),
  create: (data) => api.post("/books/add", data),
  update: (id, data) => api.put(`/books/${id}`, data),
  delete: (id) => api.delete(`/books/${id}`),

  // New Interactions
  rentBook: (id) => api.post(`/books/${id}/rent`),
  returnBook: (id) => api.put(`/books/${id}/return`),
  rateBook: (id, rating) => api.post(`/books/${id}/rating`, { rating }),
  addReview: (id, text) => api.post(`/books/${id}/review`, { text }),
  addComment: (id, message) => api.post(`/books/${id}/comment`, { message }),

  // Legacy OTP flow (for specific needs if any)
  requestOtp: (id, type) => api.post(`/books/${id}/request-otp`, { type }),
  verifyP2P: (id, otp) => api.post(`/books/${id}/verify-p2p`, { otp }),
};

// ── Requests (Borrow/Rent Request Flow) ─────────────────────────────────────
export const requestAPI = {
  buy: (bookId, type) => api.post("/requests/buy", { bookId, type }),
  accept: (requestId, ownerLocation) => api.put(`/requests/${requestId}/accept`, { ownerLocation }),
  reject: (requestId) => api.put(`/requests/${requestId}/reject`),
  verify: (requestId, otp) => api.post("/requests/verify", { requestId, otp }),
  verifyOtp: (requestId, otp) => api.post("/requests/verify-otp", { requestId, otp }),
  confirmHandover: (requestId) => api.put(`/requests/${requestId}/confirm-handover`),
  returnBook: (requestId) => api.post(`/requests/${requestId}/return`),
  complete: (requestId) => api.post(`/requests/${requestId}/complete`),
  getMyRequests: () => api.get("/requests/my-requests"),
};

// ── Rentals (Dedicated Rental System) ──────────────────────────────────────
export const rentAPI = {
  request: (bookId) => api.post("/rent/request", { bookId }),
  accept: (rentalId) => api.post("/rent/accept", { rentalId }),
  verify: (rentalId, otp) => api.post("/rent/verify", { rentalId, otp }),
  start: (rentalId) => api.post("/rent/start", { rentalId }),
  return: (rentalId) => api.post("/rent/return", { rentalId }),
  complete: (rentalId) => api.post("/rent/complete", { rentalId }),
  getMy: () => api.get("/rent/my"),
  updateLocation: (id, data) => api.put(`/rent/${id}/location`, data),
};

// ── Notifications ───────────────────────────────────────────────────────────
export const notificationAPI = {
  getMine: () => api.get("/notifications/my"),
  getUnreadCount: () => api.get("/notifications/unread-count"),
  markRead: () => api.put("/notifications/mark-read"),
};

export const dashboardAPI = {
  getSummary: () => api.get("/dashboard/summary"),
};


// ── OTP (Legacy) ─────────────────────────────────────────────────────────────
export const otpAPI = {
  generate: (bookId, type) => api.post("/otp/generate", { bookId, type }),
  verify: (bookId, otp) => api.post("/otp/verify", { bookId, otp }),
};

// ── Libraries ────────────────────────────────────────────────────────────────
export const libraryAPI = {
  // Flat list with haversine distance: { name, lat, lng, distance }
  getAll: (lat, lng, radius = 50) =>
    api.get(`/libraries?lat=${lat}&lng=${lng}&radius=${radius}`),
  getNearby: (lat, lng, radius = 20) =>
    api.get(`/libraries/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
  getBooks: (libraryId) => api.get(`/libraries/${libraryId}/books`),
  // OSM libraries: lookup by name string (critical for external libraries)
  getBooksByName: (name) => api.get(`/libraries/books-by-name?name=${encodeURIComponent(name)}`),
  // Institutional borrow/rent flow (legacy)
  createOrder: (data) => api.post("/libraries/orders", data),
  verifyOtp: (orderId, otp) => api.post(`/libraries/orders/${orderId}/verify`, { otp }),
  getMyOrders: () => api.get("/libraries/my-orders"),
};

// ── Orders ───────────────────────────────────────────────────────────────────
export const orderAPI = {
  create: (bookId, type) => api.post("/orders", { bookId, type }),
  returnOrder: (orderId) => api.put(`/orders/${orderId}/return`),
};

// ── Transactions (Unified P2P Lifecycle) ────────────────────────────────
export const transactionAPI = {
  request: (data) => api.post("/transactions/request", data),
  buy: (data) => api.post("/transactions/buy", data),
  rent: (data) => api.post("/transactions/rent", data),
  accept: (id) => api.post(`/transactions/accept/${id}`),
  reject: (id) => api.post(`/transactions/reject/${id}`),
  verify: (transactionId, otp) => api.post("/transactions/verify-otp", { transactionId, otp }),
  deliver: (id) => api.post(`/transactions/deliver/${id}`),
  getMy: () => api.get("/transactions/my"),
  return: (transactionId) => api.post("/transactions/return", { transactionId }),
};

// ── Library Transactions (User -> Library Rent Flow) ───────────────────
export const libraryTransactionAPI = {
  request: (data) => api.post("/library-transactions/request", data),
  getIncoming: () => api.get("/library-transactions/incoming"),
  accept: (id) => api.post(`/library-transactions/accept/${id}`),
  reject: (id) => api.post(`/library-transactions/reject/${id}`),
  verifyOtp: (transactionId, otp) => api.post("/library-transactions/verify-otp", { transactionId, otp }),
  deliver: (id) => api.post(`/library-transactions/deliver/${id}`),
  getMy: () => api.get("/library-transactions/my"),

  // 🏛️ Official Institutional Librarian Hub
  getLibrarianDashboard: () => api.get("/libraries/librarian/dashboard"),
  acceptLibrarianOrder: (id) => api.post(`/libraries/librarian/orders/${id}/accept`),
  verifyLibrarianOtp: (id, otp) => api.post(`/libraries/librarian/orders/${id}/verify`, { otp }),
};

// ── Reviews ───────────────────────────────────────────────────────────────────
export const reviewAPI = {
  add: (bookId, data) => api.post(`/reviews/${bookId}`, data),
  getByBook: (bookId) => api.get(`/reviews/${bookId}`),
};

// ── Cart ──────────────────────────────────────────────────────────────────────
export const cartAPI = {
  getCart: () => api.get("/cart"),
  add: (data) => api.post("/cart/add", data),
  remove: (bookId) => api.delete(`/cart/${bookId}`),
  clear: () => api.delete("/cart/clear"),
  checkout: (data) => api.post("/cart/checkout", data),
};

// ── Events ────────────────────────────────────────────────────────────────────
export const eventAPI = {
  getAll: (params) => api.get("/events", { params }),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post("/events", data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  join: (id, data) => api.post(`/events/${id}/join`, data),
  leave: (id) => api.post(`/events/${id}/leave`),
};

// ── Wishlist ──────────────────────────────────────────────────────────────────
export const wishlistAPI = {
  getWishlist: () => api.get("/wishlist"),
  add: (bookId) => api.post("/wishlist/add", { bookId }),
  remove: (bookId) => api.delete(`/wishlist/${bookId}`),
};

export default api;
