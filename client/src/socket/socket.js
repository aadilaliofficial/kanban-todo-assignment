import { io } from 'socket.io-client';

// const socket = io('http://localhost:5000', {
//   withCredentials: true,
// });

const socket = io(import.meta.env.VITE_API_URL, {
  withCredentials: true,
});


export default socket;
