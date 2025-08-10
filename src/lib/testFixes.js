// Test script to verify error fixes
import { aiService } from './aiService.js';

export const testAIService = async () => {
  try {
    console.log('Testing AI service with short content...');
    const shortResult = await aiService.calculateReadingTime('Short content');
    console.log('Short content result:', shortResult);

    console.log('Testing AI service with long content...');
    const longContent = 'This is a long piece of content that should trigger the AI reading time calculation. '.repeat(20);
    const longResult = await aiService.calculateReadingTime(longContent);
    console.log('Long content result:', longResult);
    
    return { success: true, shortResult, longResult };
  } catch (error) {
    console.log('AI service test failed (expected if no API keys):', error.message);
    return { success: false, error: error.message };
  }
};

export const testCollaboratorData = () => {
  // Test the collaborator data structure
  const mockCollaborator = {
    uid: 'test-user-id',
    displayName: 'Test User',
    email: 'test@example.com',
    avatar: '👤',
    addedAt: new Date().toISOString(), // This should work now
    permissions: 'edit'
  };
  
  console.log('Test collaborator data:', mockCollaborator);
  return { success: true, collaborator: mockCollaborator };
};

// Auto-run tests in development
if (typeof window !== 'undefined') {
  console.log('Running error fix tests...');
  testCollaboratorData();
  testAIService().then(result => {
    console.log('AI service test completed:', result);
  });
}
