import axios from "axios";
import { showToast } from "../utils/ToastNotifier";

//Get Method
export const getAPIData = async (
    url: string,
    params?: Record<string, any>,
    skipAuth?: boolean,
    signal?: AbortSignal,
    extraHeaders?: Record<string, string>,   // ← NEW: per-call headers (e.g. WAF recipe)
) => {

    // Build headers — caller's extras win over the defaults.
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(extraHeaders ?? {}),               // ← NEW: merge in anything passed
    };

    console.log('[GET API] params in fetchData = ', params ? params : undefined)
    console.log('[GET API] URL in fetchData = ', url)

    try {
        const response = await axios({
            method: 'get',
            url: url,
            headers: headers,
            params: params,
            withCredentials: skipAuth,
            signal: signal,
            validateStatus: () => true,
        });

        console.log(`Response of ${url} = `, JSON.stringify(response.data));
        return response.data;
    }
    catch (error: any) {
        // If request was cancelled, log silently and return null — don't show error banner
        if (axios.isCancel(error) || error?.name === 'CanceledError') {
            console.error(`[GET API] Request cancelled: ${url}`)
            return null
        }
        console.error(`[apiClient.ts] Error in Axios API component ${url} = `, error);

        // prefer the server's message from the response body; fall back to the generic axios one
        const serverMessage = error?.response?.data?.message;
        showToast(serverMessage || error?.message, 'warning');
        return null;
    }
};

// POST Method
interface IPostDataAPI {
    url: string;
    data?: Record<string, any> | string;   // ← allow a pre-encoded form string
    ContentType?: string;
    headers?: Record<string, string>;       // ← NEW: extra headers (the WAF set)
    skipAuth?: boolean;
    signal?: AbortSignal;
}

export const postDataAPI = async ({ url, data, ContentType = 'application/json', headers: extraHeaders, skipAuth = true, signal }: IPostDataAPI) => {

    // Build headers conditionally
    const headers: Record<string, string> = {
        'Content-Type': ContentType,
        ...(extraHeaders ?? {}),            // ← NEW: merge WAF headers (their Content-Type wins)
    };

    console.log('[Post API] params in postData = ', data ? data : undefined)
    console.log('[Post API] URL in postData = ', url)

    try {
        const response = await axios({
            method: 'post',
            url: url,
            headers: headers,
            // ✅ Only include `data` if it's not null or undefined
            ...(data ? { data } : {}),
            withCredentials: skipAuth,
            signal: signal,
            validateStatus: () => true,
        });

        console.log('Response of ', url, ' = ', JSON.stringify(response.data))

        return response.data;
    }
    catch (error: any) {
        // If request was cancelled, log silently — don't show error banner
        if (axios.isCancel(error) || error?.name === 'CanceledError') {
            console.error(`[Post API] Request cancelled: ${url}`);
            return null;
        }
        console.error(`[Post API] Error in Axios API component ${url} = `, error);

        // prefer the server's message from the response body; fall back to the generic axios one
        const serverMessage = error?.response?.data?.message;
        showToast(serverMessage || error?.message, 'warning');
        return null;
    }
}