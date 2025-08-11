// Network Health Check - Quick diagnostics utility
export const runQuickHealthCheck = async () => {
  console.group('🏥 Quick Network Health Check');
  
  const tests = [
    { name: 'Browser Online Status', test: () => navigator.onLine },
    { name: 'Local Server', test: async () => {
      try {
        const response = await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-cache' });
        return response.ok;
      } catch {
        return false;
      }
    }},
    { name: 'Fetch Function', test: () => typeof window.fetch === 'function' },
    { name: 'AbortController', test: () => typeof AbortController !== 'undefined' }
  ];

  const results = {};
  
  for (const test of tests) {
    try {
      const result = await test.test();
      results[test.name] = result ? '��� OK' : '❌ Failed';
      console.log(`${test.name}: ${results[test.name]}`);
    } catch (error) {
      results[test.name] = `❌ Error: ${error.message}`;
      console.log(`${test.name}: ${results[test.name]}`);
    }
  }
  
  console.groupEnd();
  return results;
};

// Auto-run in development
if (import.meta.env.DEV) {
  // Run health check after a short delay
  setTimeout(() => {
    runQuickHealthCheck();
  }, 2000);
}

export default { runQuickHealthCheck };
