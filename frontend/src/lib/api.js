import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sa_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh token on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('sa_refresh');
      if (refresh) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken: refresh });
          localStorage.setItem('sa_token', data.accessToken);
          localStorage.setItem('sa_refresh', data.refreshToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ── AUTH ──────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  logout:   ()     => api.post('/auth/logout'),
  me:       ()     => api.get('/auth/me'),
  googleUrl: ()    => `${window.location.origin}/api/auth/google`,
};

// ── PRODUCTS ──────────────────────────────────────────────────
export const productsApi = {
  list:    (params) => api.get('/products', { params }),
  get:     (id)     => api.get(`/products/${id}`),
  related: (id)     => api.get(`/products/${id}/related`),
  create:  (data)   => api.post('/products', data),
  update:  (id, d)  => api.put(`/products/${id}`, d),
};

// ── CATEGORIES ────────────────────────────────────────────────
export const categoriesApi = {
  list: () => api.get('/categories'),
  get:  (slug) => api.get(`/categories/${slug}`),
};

// ── CART ──────────────────────────────────────────────────────
export const cartApi = {
  get:    ()              => api.get('/cart'),
  add:    (productId, qty=1) => api.post('/cart/add', { productId, qty }),
  update: (productId, qty)   => api.put(`/cart/${productId}`, { qty }),
  remove: (productId)        => api.delete(`/cart/${productId}`),
  clear:  ()              => api.delete('/cart'),
};

// ── WISHLIST ──────────────────────────────────────────────────
export const wishlistApi = {
  get:    ()          => api.get('/wishlist'),
  toggle: (productId) => api.post('/wishlist/toggle', { productId }),
  check:  (productId) => api.get(`/wishlist/check/${productId}`),
};

// ── ORDERS ────────────────────────────────────────────────────
export const ordersApi = {
  create: (data) => api.post('/orders', data),
  myOrders: ()   => api.get('/orders/my'),
  get:   (id)    => api.get(`/orders/${id}`),
  cancel:(id)    => api.patch(`/orders/${id}/cancel`),
};

// ── PAYMENTS ──────────────────────────────────────────────────
export const paymentsApi = {
  createOrder: (amount, notes={}) => api.post('/payments/create-order', { amount, notes }),
  verify: (data) => api.post('/payments/verify', data),
};

// ── VENDORS ───────────────────────────────────────────────────
export const vendorsApi = {
  list:          (params)  => api.get('/vendors', { params }),
  get:           (id)      => api.get(`/vendors/${id}`),
  create:        (data)    => api.post('/vendors', data),
  updateMe:      (data)    => api.put('/vendors/me', data),
  bookConsult:   (id, d)   => api.post(`/vendors/${id}/consultation`, d),
  submitLead:    (id, d)   => api.post(`/vendors/${id}/lead`, d),
  myLeads:       ()        => api.get('/vendors/me/leads'),
  updateLead:    (id, status) => api.patch(`/vendors/me/leads/${id}`, { status }),
};

// ── REVIEWS ───────────────────────────────────────────────────
export const reviewsApi = {
  create:     (data) => api.post('/reviews', data),
  forProduct: (id, params) => api.get(`/reviews/product/${id}`, { params }),
  forVendor:  (id, params) => api.get(`/reviews/vendor/${id}`, { params }),
  delete:     (id)   => api.delete(`/reviews/${id}`),
};

// ── CHAT ──────────────────────────────────────────────────────
export const chatApi = {
  conversations: ()           => api.get('/chat/conversations'),
  create:        (participantId) => api.post('/chat/conversations', { participantId }),
  messages:      (convId, p)  => api.get(`/chat/conversations/${convId}/messages`, { params: p }),
  send:          (convId, content) => api.post(`/chat/conversations/${convId}/messages`, { content }),
  unread:        ()           => api.get('/chat/unread'),
};

// ── UPLOADS ───────────────────────────────────────────────────
export const uploadsApi = {
  avatar:     (file) => { const fd = new FormData(); fd.append('avatar', file); return api.post('/uploads/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  portfolio:  (files) => { const fd = new FormData(); files.forEach(f => fd.append('images', f)); return api.post('/uploads/portfolio', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  product:    (files) => { const fd = new FormData(); files.forEach(f => fd.append('images', f)); return api.post('/uploads/product', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); },
};

// ── PROMO ─────────────────────────────────────────────────────
export const promoApi = {
  validate: (code, cartTotal) => api.post('/promo/validate', { code, cartTotal }),
};

// ── USERS ─────────────────────────────────────────────────────
export const usersApi = {
  profile:        ()     => api.get('/users/profile'),
  updateProfile:  (data) => api.put('/users/profile', data),
  addresses:      ()     => api.get('/users/addresses'),
  addAddress:     (data) => api.post('/users/addresses', data),
  updateAddress:  (id,d) => api.put(`/users/addresses/${id}`, d),
  deleteAddress:  (id)   => api.delete(`/users/addresses/${id}`),
  myOrders:       ()     => api.get('/users/my-orders'),
  myProjects:     ()     => api.get('/users/my-projects'),
};

// ── NEWSLETTER ────────────────────────────────────────────────
export const newsletterApi = {
  subscribe: (email) => api.post('/newsletter/subscribe', { email }),
};

// ── ADMIN ─────────────────────────────────────────────────────
export const adminApi = {
  stats:         ()       => api.get('/admin/stats'),
  users:         (params) => api.get('/admin/users', { params }),
  vendors:       ()       => api.get('/admin/vendors'),
  verifyVendor:  (id)     => api.patch(`/admin/vendors/${id}/verify`),
  orders:        (params) => api.get('/admin/orders', { params }),
};
