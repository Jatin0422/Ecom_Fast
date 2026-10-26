const CUSTOMER_API_URL = "http://127.0.0.1:8000/customer";

function getErrorMessage(data, fallback) {
  if (typeof data.detail === "string") {
    return data.detail;
  }

  if (data.detail) {
    return JSON.stringify(data.detail);
  }

  return fallback;
}

async function requestCustomerApi(path, accessToken, options = {}) {
  const response = await fetch(`${CUSTOMER_API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const data =
    response.status === 204
      ? null
      : await response.json();

  if (!response.ok) {
    const error = new Error(
      getErrorMessage(data, "The request could not be completed.")
    );
    error.status = response.status;
    throw error;
  }

  return data;
}

export function fetchCustomerProduct(accessToken, productId) {
  return requestCustomerApi(
    `/products/${encodeURIComponent(productId)}`,
    accessToken
  );
}

export function addCustomerCartItem(accessToken, productId, quantity = 1) {
  return requestCustomerApi("/cart", accessToken, {
    method: "POST",
    body: JSON.stringify({ product_id: Number(productId), quantity }),
  });
}

export async function fetchCustomerCart(accessToken) {
  const items = await requestCustomerApi("/cart", accessToken);
  if (!Array.isArray(items)) {
    throw new Error("The server returned an invalid cart.");
  }
  return items;
}

export function updateCustomerCartItem(accessToken, productId, quantity) {
  return requestCustomerApi(`/cart/${encodeURIComponent(productId)}`, accessToken, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
}

export function removeCustomerCartItem(accessToken, productId) {
  return requestCustomerApi(`/cart/${encodeURIComponent(productId)}`, accessToken, {
    method: "DELETE",
  });
}

export function checkoutCustomerCart(accessToken, shippingAddress) {
  return requestCustomerApi("/orders/from-cart", accessToken, {
    method: "POST",
    body: JSON.stringify({
      shipping_address: shippingAddress,
      payment_method: "cod",
    }),
  });
}

export function orderProductNow(
  accessToken,
  productId,
  quantity,
  shippingAddress
) {
  return requestCustomerApi("/orders/buy-now", accessToken, {
    method: "POST",
    body: JSON.stringify({
      product_id: Number(productId),
      quantity,
      shipping_address: shippingAddress,
      payment_method: "cod",
    }),
  });
}

export async function fetchCustomerOrders(accessToken) {
  const orders = await requestCustomerApi("/orders", accessToken);
  if (!Array.isArray(orders)) {
    throw new Error("The server returned an invalid orders list.");
  }
  return orders;
}

export function cancelCustomerOrder(accessToken, orderId) {
  return requestCustomerApi(`/orders/${encodeURIComponent(orderId)}/cancel`, accessToken, {
    method: "POST",
  });
}
