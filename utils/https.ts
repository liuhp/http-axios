import axios, { AxiosRequestConfig } from "axios"
import qs from "qs"
import { ElMessage } from "element-plus"
import { debounce } from "./debounce"

type OptionParams = {
  url: string
  method?:
    | "options"
    | "get"
    | "head"
    | "post"
    | "put"
    | "delete"
    | "trace"
    | "connect"
  data?: object
  contentType?: "json" | "urlencoded" | "multipart"
  prefixUrl?: string
  options?: any
}

const contentTypes = {
  json: "application/json; charset=utf-8",
  urlencoded: "application/x-www-form-urlencoded; charset=utf-8",
  multipart: "multipart/form-data",
}

// 错误信息吐司提示
function toastMsg() {
  Object.keys(errorMsgObj).map((item) => {
    ElMessage.error(item)
    delete errorMsgObj[item]
  })
}

// 存放错误信息，只存放不重复的信息
let errorMsgObj = {}

const defaultOptions = {
  withCredentials: true, // 允许把cookie传递到后台
  headers: {
    Accept: "application/json",
    "Content-Type": contentTypes.json,
  },
  timeout: 15000,
}

// 请求拦截，放在callApi外面，同一个接口只会调用一次
// 若放在callApi里面，多个接口同时调用时同一个接口会执行多次拦截
axios.interceptors.request.use((request: AxiosRequestConfig<any>) => {
  // 移除起始部分 / 所有请求url走相对路径
  const { url = "" } = request
  request.url = url.replace(/^\//, "")
  // 如果要携带token或者其他参数，可在这部分进行操作
  return request
})

export const callApi = ({
  url,
  data = {},
  method = "get",
  options = {},
  contentType = "json", // json || urlencoded || multipart
  prefixUrl = "api",
}: OptionParams) => {
  if (!url) {
    const error = new Error("请传入url")
    return Promise.reject(error)
  }
  const fullUrl = `/${prefixUrl}/${url}`

  const newOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      "Content-Type":
        (options.headers && options.headers["Content-Type"]) ||
        contentTypes[contentType],
    },
    method,
  }
  if (method === "get") {
    newOptions.params = data
  }

  if (method !== "get" && method !== "head") {
    newOptions.data = data
    if (data instanceof FormData) {
      newOptions.headers = {
        "x-requested-with": "XMLHttpRequest",
        "cache-control": "no-cache",
      }
    } else if (newOptions.headers["Content-Type"] === contentTypes.urlencoded) {
      newOptions.data = qs.stringify(data)
    } else {
      Object.keys(data).forEach((item) => {
        if (
          data[item] === null ||
          data[item] === undefined ||
          data[item] === ""
        ) {
          delete data[item]
        }
      })
      // 没有必要，因为axios会将JavaScript对象序列化为JSON
      // newOptions.data = JSON.stringify(data);
    }
  }

  return axios({
    url: fullUrl,
    ...newOptions,
  })
    .then((response) => {
      const { data } = response
      if (data.code === "xxx") {
        // 与服务端约定
        // 登录校验失败
      } else if (data.code === "xxx") {
        // 与服务端约定
        // 无权限
        // router.replace({ path: '/403' })
      } else if (data.code === "xxx") {
        // 与服务端约定
        return Promise.resolve(data)
      } else {
        const { message } = data
        if (!errorMsgObj[message]) {
          errorMsgObj[message] = message
        }
        // 执行报错提示，一样的信息只会提示一次
        setTimeout(debounce(toastMsg, 1000, true), 1000)
        return Promise.reject(data)
      }
    })
    .catch((error) => {
      if (error.response) {
        const { data } = error.response
        const resCode = data.status
        const resMsg = data.message || "服务异常"
        // if (resCode === 401) { // 与服务端约定
        //     // 登录校验失败
        // } else if (data.code === 403) { // 与服务端约定
        //     // 无权限
        //     router.replace({ path: '/403' })
        // }
        if (!errorMsgObj[resMsg]) {
          errorMsgObj[resMsg] = resMsg
        }
        setTimeout(debounce(toastMsg, 1000, true), 1000)
        const err = { code: resCode, respMsg: resMsg }
        return Promise.reject(err)
      } else {
        const err = { type: "canceled", respMsg: "数据请求超时" }
        return Promise.reject(err)
      }
    })
}
