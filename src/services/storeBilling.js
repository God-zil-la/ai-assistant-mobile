import { Platform } from 'react-native';
import * as adapter from 'expo-iap';
import { API_BASE_URL } from '../config/api';
import { request } from './apiClient';
import { getAuthToken } from './tokenService';
import { createStoreBilling } from './storeBillingCore';

export const storeBilling = createStoreBilling({ adapter, getToken: getAuthToken,
  provider: Platform.OS === 'ios' ? 'apple' : 'google',
  api: (path, body, token) => {
    const [endpoint, query] = path.split('?');
    return request(`${API_BASE_URL}/payments/api/store/${endpoint}/${query ? `?${query}` : ''}`, {
      token, ...(body === undefined ? {} : { method: 'POST', body }),
    });
  },
});
