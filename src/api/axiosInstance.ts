import axios from 'axios';

const API_KEY = import.meta.env.VITE_MBTA_API_KEY;

export const mbtaApi = axios.create({
  baseURL: 'https://api-v3.mbta.com',
  headers: {
    'Accept': 'application/vnd.api+json',
    ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
  },
});
