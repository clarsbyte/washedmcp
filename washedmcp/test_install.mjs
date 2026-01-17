// Test script for the new Smithery deep linking functionality
import http from 'http';

const testData = {
  jsonrpc: "2.0",
  method: "tools/call",
  params: {
    name: "installMCPServer",
    arguments: {
      mcp_name: "GitHub MCP",
      env_vars: {
        GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_test_token"
      }
    }
  },
  id: 1
};

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/mcp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Raw Response:', data);
    
    // Parse SSE lines
    const lines = data.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.substring(6);
        try {
          const result = JSON.parse(jsonStr);
          console.log('\nParsed JSON:', JSON.stringify(result, null, 2));
          
          if (result.result && result.result.content) {
            console.log('\nInstallation Result Content:');
            console.log(result.result.content[0].text);
          }
        } catch (e) {
          console.error('Error parsing JSON line:', e);
        }
      }
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(JSON.stringify(testData));
req.end();