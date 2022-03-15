import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElLoading } from 'element-plus'
import { LoadingOptionsResolved } from 'element-plus/lib/components'
import type {
  RequestConfig,
  InterceptorHooks,
  CancelRequestSource,
  ResultData
} from './types'


class MyRequest {
  config: AxiosRequestConfig
  interceptorHooks?: InterceptorHooks
  showLoading: boolean
  loading?: LoadingOptionsResolved
  // axios实例
  instance: AxiosInstance
  /*
  存放取消方法的集合
  * 在创建请求后将取消请求方法 push 到该集合中
  * 封装一个方法，可以取消请求，传入 url: string|string[]
  * 在请求之前判断同一URL是否存在，如果存在就取消请求
  */
  cancelRequestSourceList?: CancelRequestSource[]

  /*
存放所有请求URL的集合
* 请求之前需要将url push到该集合中
* 请求完毕后将url从集合中删除
* 添加在发送请求之前完成，删除在响应之后删除
*/
  requestUrlList?: string[]

  constructor(options: RequestConfig) {
    this.config = options
    this.showLoading = options.showLoading ?? true
    this.requestUrlList = []
    this.cancelRequestSourceList = []
    this.instance = axios.create(options)
    this.interceptorHooks = options.interceptorHooks
    // 拦截器执行顺序 接口请求 -> 实例请求 -> 全局请求 -> 实例响应 -> 全局响应 -> 接口响应
    this.instance.interceptors.request.use((res: AxiosRequestConfig) => {
      if (this.showLoading) {
        // @ts-ignore
        this.loading = ElLoading.service({
          lock: true,
          text: 'Loading',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        })
      }
      return res
    }, (error: any) => error)
    this.setupInterceptor()
    // 全局响应拦截器保证最后执行
    this.instance.interceptors.response.use(
      (res: AxiosResponse) => {
        this.loading?.closed()
        return res
      },
      (error: any) => {
        this.loading?.closed()
        return error
      })
  }

  setupInterceptor(): void {
    this.instance.interceptors.request.use(
      this.interceptorHooks?.requestInterceptor,
      this.interceptorHooks?.requestInterceptorCatch
    )
    this.instance.interceptors.response.use(
      this.interceptorHooks?.responseInterceptor,
      this.interceptorHooks?.responseInterceptorCatch
    )

  }

  /**
   * @description: 获取指定 url 在 cancelRequestSourceList 中的索引
   * @param {string} url
   * @returns {number} 索引位置
   */
  private getSourceIndex(url: string): number {
    // @ts-ignore
    return this.cancelRequestSourceList?.findIndex(
      (item: CancelRequestSource) => {
        return Object.keys(item)[0] === url
      }
    ) as number
  }

  /**
   * @description: 删除 requestUrlList 和 cancelRequestSourceList
   * @param {string} url
   * @returns {*}
   */
  private delUrl(url: string) {
    // @ts-ignore
    const urlIndex = this.requestUrlList?.findIndex(u => u === url)
    const sourceIndex = this.getSourceIndex(url)
    // 删除url和cancel方法
    urlIndex !== -1 && this.requestUrlList?.splice(urlIndex as number, 1)
    sourceIndex !== -1 &&
    this.cancelRequestSourceList?.splice(sourceIndex as number, 1)
  }

  request<T = any>(config: RequestConfig): Promise<T> {
    if (!config.showLoading) {
      this.showLoading = false
    }
    return new Promise((resolve, reject) => {
      // 如果我们为单个请求设置拦截器，这里使用单个请求的拦截器
      if (config.interceptorHooks?.requestInterceptor) {
        config = config.interceptorHooks.requestInterceptor(config)
      }
      const url = config.url
      // url存在保存取消请求方法和当前请求url
      if (url) {
        this.requestUrlList?.push(url)
        config.cancelToken = new axios.CancelToken(c => {
          this.cancelRequestSourceList?.push({
            [url]: c
          })
        })
      }
      this.instance
        .request<any, ResultData<T>>(config)
        .then((res) => {
          // 如果我们为单个响应设置拦截器，这里使用单个响应的拦截器
          if (config.interceptorHooks?.responseInterceptor) {
            // @ts-ignore
            res = config.interceptorHooks.responseInterceptor<T>(res)
          }
        // @ts-ignore
          resolve(res)
          this.showLoading = true
        })
        .catch((error: any) => {
          reject(error)
          this.showLoading = true
        })
        .finally(() => {
          url && this.delUrl(url)
        })
    })
  }

  get<T = any>(config: RequestConfig): Promise<T> {
    return this.request({ ...config, method: 'GET' })
  }

  post<T = any>(config: RequestConfig): Promise<T> {
    return this.request({ ...config, method: 'POST' })
  }

  delete<T = any>(config: RequestConfig): Promise<T> {
    return this.request({ ...config, method: 'DELETE' })
  }

  patch<T = any>(config: RequestConfig): Promise<T> {
    return this.request({ ...config, method: 'PATCH' })
  }

  // 取消请求
  cancelRequest(url: string | string[]) {
    if (typeof url === 'string') {
      // 取消单个请求
      const sourceIndex = this.getSourceIndex(url)
      sourceIndex >= 0 && this.cancelRequestSourceList?.[sourceIndex][url]()
    } else {
      // 存在多个需要取消请求的地址
      url.forEach(u => {
        const sourceIndex = this.getSourceIndex(u)
        sourceIndex >= 0 && this.cancelRequestSourceList?.[sourceIndex][u]()
      })
    }
  }

  // 取消全部请求
  cancelAllRequest() {
    this.cancelRequestSourceList?.forEach(source => {
      const key = Object.keys(source)[0]
      source[key]()
    })
  }
}

export default MyRequest
export { RequestConfig, InterceptorHooks }
