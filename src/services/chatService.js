import { getBotChatEndpoint } from '../config/api';

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
    throw new Error(
      data.error ||
        data.detail ||
        'Unable to send your message.',
    );
  }

  return data;
}

export async function sendChatMessage(
  token,
  botId,
  message,
  conversationId,
) {
  const payload = {
    message,
  };

  if (conversationId) {
    payload.conversation_id = conversationId;
  }

  const response = await fetch(
    getBotChatEndpoint(botId),
    {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );

  return parseResponse(response);
}