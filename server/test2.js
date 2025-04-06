const axios = require('axios');

(async () => {
  for (let i = 1; i <= 100; i++) {
    try {
      const res = await axios.get('http://localhost:5000/api/v1');
      console.log(`[${i}] Status: ${res.status}`);
    } catch (err) {
      if (err.response) {
        console.log(`[${i}] Rate Limited! Status: ${err.response.status}`);
      } else {
        console.error(`[${i}] Error: ${err.message}`);
      }
    }
  }
})();
