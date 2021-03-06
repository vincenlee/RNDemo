import JsonUtils from "./JsonUtils";
import EncodeUtils from "./EncodeUtils";
import ProgressDialog from "../component/ProgressDialog"

/**
 * 返回Promise对象的网络请求工具类
 * 封装了请求超时/部分错误提示等
 */
export default class HttpUtils {

    /**
     * 开启GET请求
     * @param url       请求地址
     * @param params    GET请求参数,Map
     * @return promise对象
     */
    static startGetRequest(url: String, params: Map) {
        // 展示加载动画
        ProgressDialog.show();
        if (params != null && params.size !== 0) {
            url += "?";
            params.forEach((value, key) => {
                url += (key + "=" + value + "&");
            });
            url = url.substr(0, url.length - 1)
        }
        return Promise.race([fetch(url, {
            method: "Get",
            credentials: "include"
        }), new Promise(((resolve, reject) => {
            setTimeout(() => reject(new Error('请求超时')), timeOut)
        }))])
            .then((response: Response) => checkStatus(response))
            .then((response: Response) => {
                // 获取到了数据, 后面本地处理速度就比较快了
                ProgressDialog.hide();
                return response.text()
            })
            .then((responseText: String) => {
                // 根据回调是否被Base64加密进行判断
                if (responseText.indexOf("{") === -1 && responseText.match(/^[0-9a-zA-Z+\/]+[=]{0,3}$/)) {
                    responseText = EncodeUtils.decodeBase64Content(responseText);
                }
                return JsonUtils.stringToJson(responseText);
            })
    }

    /**
     * 开启POST请求(测试没有问题)
     * @param url       请求地址
     * @param params    POST请求参数,Map
     * @return promise对象
     */
    static startPostRequest = (url: String, params: Map) => {
        // 展示加载动画
        ProgressDialog.show();
        let formData = new FormData();
        if (params != null && params.size !== 0) {
            params.forEach((value, key) => {
                formData.append(key, value);
            })
        }

        // 这里默认的POST字段传输是form表单形式, 另外一种application/json
        return Promise.race([fetch(url, {
            method: "POST",
            credentials: "include",
            body: formData,
        }), new Promise((resolve, reject) => {
            setTimeout(() => reject(new Error('请求超时')), timeOut) // 注意. 如果是调试模式, 这里会立即执行, 没有延迟效果(除非设置超大)
        })])
            .then((response: Response) => checkStatus(response))
            .then((response: Response) => {
                // 获取到了数据, 后面本地处理速度就比较快了
                ProgressDialog.hide();
                return response.text()
            })
            .then((responseText: String) => {
                // 根据回调是否被Base64加密进行判断
                if (responseText.indexOf("{") === -1 && responseText.match(/^[0-9a-zA-Z+\/]+[=]{0,3}$/)) {
                    responseText = EncodeUtils.decodeBase64Content(responseText);
                }
                return JsonUtils.stringToJson(responseText);
            })
    }

}

/**
 * 请求超时时间
 */
const timeOut = 5 * 1000;

/**
 * 解决fetch不提示某些错误的问题
 */
function checkStatus(response) {
    if (response.ok || (response.status >= 200 && response.status < 300)) {
        return response;
    }
    throw new Error(response.statusText); // 或者 reject(new Error('test'));
}