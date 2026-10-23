import { api } from './api';

export const getAddresses = () => api('/addresses');
export const getDefaultAddress = () => api('/addresses/default');
export const createAddress = (data) => api('/addresses', { method: 'POST', body: data });
export const setDefaultAddress = (id) => api(`/addresses/${id}/default`, { method: 'PATCH' });
export const deleteAddress = (id) => api(`/addresses/${id}`, { method: 'DELETE' });