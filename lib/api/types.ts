import { AxiosRequestConfig, AxiosResponse } from 'axios'

export interface InterceptorHooks {
  requestInterceptor?: (config: AxiosRequestConfig) => AxiosRequestConfig
  requestInterceptorCatch?: (error: any) => any

  responseInterceptor?: <T = AxiosResponse> (response: T) => T
  responseInterceptorCatch?: (error: any) => any
}

export interface RequestConfig extends AxiosRequestConfig {
  showLoading?: boolean
  interceptorHooks?: InterceptorHooks
}

export interface CancelRequestSource {
  [index: string]: () => void
}

export interface ResultData<T> {
  data?: T
  statusCode: number
  message: string
}
