import { 
  getWhiteboards, 
  deleteWhiteboard, 
  getWhiteboard 
} from './firestoreService';

// Helper function to check if whiteboard has meaningful content
const hasWhiteboardContent = (content) => {
  if (!content || typeof content !== 'object') return false;
  
  try {
    // Check if there are records in the content
    const records = content.records || content.store?.records || {};
    if (Object.keys(records).length === 0) return false;
    
    // Filter for meaningful content types
    const meaningfulContent = Object.values(records).filter(record => {
      if (!record || !record.typeName) return false;
      
      // Consider these as meaningful content:
      const meaningfulTypes = [
        'shape', // Any shape drawn
        'asset', // Images, files
        'document', // Document content
        'page' // If there are multiple pages
      ];
      
      // For shapes, also check if they have meaningful properties
      if (record.typeName === 'shape') {
        // Exclude default/empty shapes that might be auto-created
        if (record.type === 'draw' && (!record.props?.segments || record.props.segments.length === 0)) {
          return false;
        }
        if (record.type === 'text' && (!record.props?.text || record.props.text.trim() === '')) {
          return false;
        }
        // If shape has meaningful content, count it
        return true;
      }
      
      return meaningfulTypes.includes(record.typeName);
    });
    
    // Only save if there are actual meaningful content items
    return meaningfulContent.length > 0;
  } catch (error) {
    console.warn('Error checking whiteboard content:', error);
    // If we can't determine content, err on the side of keeping it
    return true;
  }
};

// Clean up empty whiteboards
export const cleanupEmptyWhiteboards = async () => {
  try {
    console.log('Starting whiteboard cleanup...');
    
    const whiteboards = await getWhiteboards();
    let deletedCount = 0;
    
    for (const whiteboard of whiteboards) {
      // Check if whiteboard has content
      const hasContent = hasWhiteboardContent(whiteboard.content);
      
      if (!hasContent) {
        console.log(`Deleting empty whiteboard: ${whiteboard.title} (${whiteboard.id})`);
        await deleteWhiteboard(whiteboard.id);
        deletedCount++;
      }
    }
    
    console.log(`Cleanup complete. Deleted ${deletedCount} empty whiteboards.`);
    return deletedCount;
  } catch (error) {
    console.error('Error during whiteboard cleanup:', error);
    return 0;
  }
};

// Clean up specific whiteboard if it's empty
export const cleanupWhiteboardIfEmpty = async (whiteboardId) => {
  try {
    const whiteboard = await getWhiteboard(whiteboardId);
    if (!whiteboard) return false;
    
    const hasContent = hasWhiteboardContent(whiteboard.content);
    
    if (!hasContent) {
      console.log(`Deleting empty whiteboard: ${whiteboard.title} (${whiteboardId})`);
      await deleteWhiteboard(whiteboardId);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error cleaning up whiteboard:', error);
    return false;
  }
};

export default {
  cleanupEmptyWhiteboards,
  cleanupWhiteboardIfEmpty
};
