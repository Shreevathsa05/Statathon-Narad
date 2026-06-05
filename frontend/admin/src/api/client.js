const baseURL = "/api";

async function fetchWithInterceptor(url, options = {}, isRetry = false) {
  const headers = new Headers(options.headers || {});
  if (options.body instanceof FormData) {
    headers.delete("Content-Type");
  } else if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const config = {
    ...options,
    headers,
    credentials: "include",
  };

  if (
    config.body &&
    typeof config.body !== "string" &&
    !(config.body instanceof FormData)
  ) {
    config.body = JSON.stringify(config.body);
  }

  let finalUrl = `${baseURL}${url}`;
  if (options.query) {
    const params = new URLSearchParams();

    Object.entries(options.query).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      } else {
        params.append(key, value);
      }
    });

    finalUrl += `?${params.toString()}`;
  }

  const response = await fetch(finalUrl, config);

  if (response.status === 401 && !isRetry) {
    try {
      const refreshRes = await fetch(`${baseURL}/auth/refresh`, {
        method: "GET",
        credentials: "include",
      });
      if (!refreshRes.ok) throw new Error("Refresh failed");
      return fetchWithInterceptor(url, options, true);
    } catch {
      const path = window.location.pathname;
      if (path !== "/login" && path !== "/setup-password") {
        window.location.href = "/login";
      }
      throw new Error("Unauthorized");
    }
  }

  let data = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {
    const errorMsg = data?.message || response.statusText || "Request failed";
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return { data };
}

const client = {
  get: (url, options) =>
    fetchWithInterceptor(url, { ...options, method: "GET" }),
  post: (url, body, options) =>
    fetchWithInterceptor(url, { ...options, method: "POST", body }),
  patch: (url, body, options) =>
    fetchWithInterceptor(url, { ...options, method: "PATCH", body }),
  delete: (url, options) =>
    fetchWithInterceptor(url, { ...options, method: "DELETE" }),
};

export default client;
