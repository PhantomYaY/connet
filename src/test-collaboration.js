// Simple collaboration test script
import collaborationService from './lib/collaborationService';

window.testCollaboration = async () => {
  console.log('🧪 Testing collaboration service...');
  
  // Test joining a note
  const testNoteId = 'test-note-123';
  await collaborationService.joinNote(testNoteId);
  
  // Test updating cursor
  collaborationService.updateCursor({ x: 100, y: 200, line: 5, column: 10 });
  
  // Log status
  console.log('Collaboration status:', collaborationService.isCollaborating());
  console.log('Current note ID:', collaborationService.currentNoteId);
  console.log('Collaborators:', collaborationService.getCollaborators());
  
  return collaborationService;
};

// Export for global access
export default window.testCollaboration;
