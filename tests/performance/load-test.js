const autocannon = require('autocannon');

// Load test configuration
const config = {
    url: 'http://localhost:3001/api/convert',
    connections: 10,
    duration: 10,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        content: `# Performance Test

This is a **performance test** for the markdown preview API.

## Features Tested

- **Bold text** and *italic text*
- \`Inline code\` and code blocks
- Lists and tables
- Links and images

\`\`\`javascript
function test() {
  console.log("Performance test running...");
  return "Success!";
}
\`\`\`

| Feature | Status |
|---------|--------|
| Speed | ✅ Fast |
| Reliability | ✅ Stable |
| Scalability | ✅ Good |

> This is a blockquote for testing purposes.

1. First item
2. Second item
3. Third item

- Unordered item 1
- Unordered item 2
- Unordered item 3

[Test Link](https://example.com)

![Test Image](https://via.placeholder.com/150)

---

*Test completed successfully!* 🚀`,
        theme: 'light'
    })
};

console.log('🚀 Starting load test...');
console.log(`URL: ${config.url}`);
console.log(`Connections: ${config.connections}`);
console.log(`Duration: ${config.duration}s`);

// Run the load test
autocannon(config, (err, result) => {
    if (err) {
        console.error('❌ Load test failed:', err);
        process.exit(1);
    }

    console.log('\n📊 Load Test Results:');
    console.log('=====================');
    console.log(`Average Latency: ${result.latency.average}ms`);
    console.log(`Max Latency: ${result.latency.max}ms`);
    console.log(`Min Latency: ${result.latency.min}ms`);
    console.log(`Requests/sec: ${result.requests.average}`);
    console.log(`Total Requests: ${result.requests.total}`);
    console.log(`Total Duration: ${result.duration}s`);
    console.log(`Errors: ${result.errors}`);
    console.log(`Timeouts: ${result.timeouts}`);
    console.log(`Non-2xx Responses: ${result.non2xx}`);

    // Performance thresholds
    const thresholds = {
        avgLatency: 100, // ms
        maxLatency: 500, // ms
        requestsPerSec: 100,
        errorRate: 0.01 // 1%
    };

    console.log('\n🎯 Performance Analysis:');
    console.log('========================');

    if (result.latency.average <= thresholds.avgLatency) {
        console.log('✅ Average latency is good');
    } else {
        console.log('❌ Average latency is too high');
    }

    if (result.latency.max <= thresholds.maxLatency) {
        console.log('✅ Max latency is acceptable');
    } else {
        console.log('❌ Max latency is too high');
    }

    if (result.requests.average >= thresholds.requestsPerSec) {
        console.log('✅ Request rate is good');
    } else {
        console.log('❌ Request rate is too low');
    }

    const errorRate = result.errors / result.requests.total;
    if (errorRate <= thresholds.errorRate) {
        console.log('✅ Error rate is acceptable');
    } else {
        console.log('❌ Error rate is too high');
    }

    console.log('\n🎉 Load test completed!');
}); 