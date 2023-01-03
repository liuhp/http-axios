import { callApi } from "../utils/https"

export const fileGetQuery = () =>
  callApi({
    url: "file/upload",
    contentType: "multipart",
  })
