import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || ''

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

apiClient.interceptors.request.use((config) => {
  const merchantId = import.meta.env.VITE_MERCHANT_ID
  const apiKey = import.meta.env.VITE_MERCHANT_API_KEY
  if (merchantId) config.headers['X-Merchant-Id'] = merchantId
  if (apiKey) config.headers['X-Api-Key'] = apiKey
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || '서버 오류가 발생했습니다.'
    return Promise.reject(new Error(msg))
  },
)
