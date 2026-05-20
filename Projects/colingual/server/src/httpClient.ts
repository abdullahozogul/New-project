import axios from 'axios'

/** Wikipedia and many publishers block requests without a descriptive User-Agent. */
export const http = axios.create({
  timeout: 12_000,
  headers: {
    'User-Agent':
      'Colingual/1.0 (https://github.com/colingual; language-learning) axios/1.0',
    Accept: 'text/html,application/xhtml+xml,application/json',
    'Accept-Language': 'en-US,en;q=0.9,tr;q=0.8',
  },
  maxRedirects: 5,
})
