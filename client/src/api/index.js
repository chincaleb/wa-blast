const BASE = '/api';

async function downloadFile(path, filename) {
  const token = getToken();
  const res = await fetch(BASE + path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error(`Export failed: HTTP ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getToken() {
  return localStorage.getItem('token');
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  login: (u, p) => request('POST', '/auth/login', { username: u, password: p }),

  getUsers: () => request('GET', '/auth/users'),
  updateUser: (id, body) => request('PATCH', `/auth/users/${id}`, body),

  getContacts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/contacts${qs ? '?' + qs : ''}`);
  },
  addContact: (body) => request('POST', '/contacts', body),
  bulkContacts: (contacts) => request('POST', '/contacts/bulk', { contacts }),
  importSheet: (url) => request('POST', '/contacts/import-sheet', { url }),
  updateStatus: (id, status) => request('PATCH', `/contacts/${id}/status`, { status }),
  deleteContact: (id) => request('DELETE', `/contacts/${id}`),
  deleteAllContacts: () => request('DELETE', '/contacts'),

  getTemplates: () => request('GET', '/templates'),
  addTemplate: (body) => request('POST', '/templates', body),
  updateTemplate: (id, body) => request('PATCH', `/templates/${id}`, body),
  deleteTemplate: (id) => request('DELETE', `/templates/${id}`),
  deleteAllTemplates: () => request('DELETE', '/templates'),

  getNext: () => request('GET', '/sends/next'),
  logSend: (contact_id) => request('POST', '/sends', { contact_id }),
  logResponse: (contact_id) => request('POST', '/sends/response', { contact_id }),

  getStats: () => request('GET', '/stats'),

  exportContacts: async (fmt) => downloadFile(`/export/contacts?format=${fmt}`, `contacts.${fmt}`),
  exportSends: async (fmt) => downloadFile(`/export/sends?format=${fmt}`, `sends.${fmt}`)

};
