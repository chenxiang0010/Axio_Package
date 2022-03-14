import MyRequest from './requet'
import { API_BASE_URL, TIME_OUT } from '../utils/baseConfig'
import localCache from '../utils/LocalCache'

const request = new MyRequest({
  baseURL: API_BASE_URL,
  timeout: TIME_OUT,
  interceptorHooks: {
    requestInterceptor: (config) => {
      const token = localCache.getCache('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    requestInterceptorCatch: (error: any) => error,
    responseInterceptor: res => res,
    responseInterceptorCatch: (error: any) => error
  }
})

// 取消请求
export const cancelRequest = (url: string | string[]) => request.cancelRequest(url)
// 取消全部请求
export const cancelAllRequest = () => request.cancelAllRequest()

export default request

