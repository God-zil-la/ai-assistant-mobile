import {
  API_ENDPOINTS,
  getConversationEndpoint,
} from '../config/api';

async function parseResponse(response) {
  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      'The server returned an invalid response.',
    );
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

export async function getConversations(token) {
  const response = await fetch(
    API_ENDPOINTS.conversations,
    {
      method: 'GET',
      headers: {
        Authorization: `Token ${token}`,
      },
    },
  );

  return parseResponse(response);
}

export async function createConversation(
  token,
  botId,
  title = '',
) {
  const response = await fetch(
    API_ENDPOINTS.conversations,
    {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bot_id: botId,
        title,
      }),
    },
  );

  return parseResponse(response);
}

export async function getConversation(
  token,
  conversationId,
) {
  const response = await fetch(
    getConversationEndpoint(conversationId),
    {
      method: 'GET',
      headers: {
        Authorization: `Token ${token}`,
      },
    },
  );

  return parseResponse(response);
}

export async function deleteConversation(
  token,
  conversationId,
) {
  const response = await fetch(
    getConversationEndpoint(conversationId),
    {
      method: 'DELETE',
      headers: {
        Authorization: `Token ${token}`,
      },
    },
  );

  if (response.ok) {
    return;
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      'Unable to delete the conversation.',
    );
  }

  throw new Error(
    data.error ||
      data.detail ||
      'Unable to delete the conversation.',
  );
}