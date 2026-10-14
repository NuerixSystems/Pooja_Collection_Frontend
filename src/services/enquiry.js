// Enquiry storage — localStorage-based. Enquiries are per browser: the shop receives them
// through the WhatsApp message that opens when the customer clicks "Send Request".

const KEY = 'pooja-collection:enquiries:v1';

const MAX = 50;

function readAll() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* storage unavailable — enquiry still opens WhatsApp for this session */
  }
}

/** All saved enquiries, newest first. */
export const listEnquiries = () => readAll();

/** Remove one enquiry by id. */
export function removeEnquiry(id) {
  writeAll(readAll().filter((e) => e.id !== id));
}

/** Clear all saved enquiries. */
export function clearEnquiries() {
  writeAll([]);
}

const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `enq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/**
 * Save an enquiry locally. Called right before opening WhatsApp so "Your Enquiry List" can show it later.
 * Returns the stored record.
 */
export function saveEnquiry({ product, design, qty, customer }) {
  const now = new Date().toISOString();
  const enquiry = {
    id: newId(),
    productId: product?.id || null,
    productSlug: product?.slug || null,
    productName: product?.name || '',
    productImage: product?.image || '',
    designId: design?.id || null,
    designLabel: design?.label || null,
    qty: qty || 1,
    customerName: customer?.name || '',
    customerPhone: customer?.phone || '',
    customerWhatsapp: customer?.whatsapp || customer?.phone || '',
    customerEmail: customer?.email || '',
    customerAddress: customer?.address || '',
    message: customer?.message || '',
    createdAt: now,
    status: 'Pending',
  };
  writeAll([enquiry, ...readAll()]);
  return enquiry;
}