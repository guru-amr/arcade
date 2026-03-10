import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
};

export default function () {
  // Test GET endpoint (no auth needed)
  const res = http.get('http://localhost:8080/api/diagnostic/health');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
