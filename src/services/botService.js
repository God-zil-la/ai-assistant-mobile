import { API_ENDPOINTS } from '../config/api';

async function parseResponse(response) {
  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error('The server returned an invalid response.');
  }

  if (!response.ok) {
    let message =
      data.error ||
      data.detail ||
      data.errors?.join(' ');

    if (!message && typeof data === 'object') {
      const firstError = Object.values(data)[0];

      if (Array.isArray(firstError)) {
        message = firstError.join(' ');
      } else if (typeof firstError === 'string') {
        message = firstError;
      }
    }

    throw new Error(
      message ||
        'Something went wrong. Please try again.',
    );
  }

  return data;
}

async function parseDeleteResponse(response) {
  if (response.ok) {
    return;
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error('Unable to delete the assistant.');
  }

  throw new Error(
    data.error ||
      data.detail ||
      'Unable to delete the assistant.',
  );
}

export async function getBots(token) {
  const response = await fetch(API_ENDPOINTS.bots, {
    method: 'GET',
    headers: {
      Authorization: `Token ${token}`,
    },
  });

  return parseResponse(response);
}

export async function createBot(token, botData) {
  const response = await fetch(API_ENDPOINTS.bots, {
    method: 'POST',
    headers: {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(botData),
  });

  return parseResponse(response);
}

export async function updateBot(token, botId, botData) {
  const response = await fetch(
    `${API_ENDPOINTS.bots}${botId}/`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(botData),
    },
  );

  return parseResponse(response);
}

export async function deleteBot(token, botId) {
  const response = await fetch(
    `${API_ENDPOINTS.bots}${botId}/`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Token ${token}`,
      },
    },
  );

  return parseDeleteResponse(response);
}