import { API_ENDPOINTS } from '../config/api';

async function parseResponse(response) {
  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error('The server returned an invalid response.');
  }

  if (!response.ok) {
    const message =
      data.error ||
      data.detail ||
      data.errors?.join(' ') ||
      'Something went wrong. Please try again.';

    throw new Error(message);
  }

  return data;
}

export async function loginUser(username, password) {
  const response = await fetch(API_ENDPOINTS.login, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  return parseResponse(response);
}

export async function registerUser({
  username,
  email,
  password,
  password2,
}) {
  const response = await fetch(API_ENDPOINTS.register, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      email,
      password,
      password2,
    }),
  });

  return parseResponse(response);
}

export async function getCurrentUser(token) {
  const response = await fetch(API_ENDPOINTS.me, {
    method: 'GET',
    headers: {
      Authorization: `Token ${token}`,
    },
  });

  return parseResponse(response);
}
