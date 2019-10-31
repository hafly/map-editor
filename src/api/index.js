import axios from 'axios';

export const baseURL = process.env.BASE_URL;

const instance = axios.create({
    baseURL: baseURL,
    timeout: 10000
});

export default instance;