import { loadConfig } from '../config/env';
import { NotionService } from '../services/notion.service';
import { getLogger } from './logger';

/**
 * Test script to verify Notion setup
 * Run with: npx ts-node src/utils/test-setup.ts
 */
async function testSetup() {
  const logger = getLogger();
  
  try {
    logger.info('Testing Notion setup...');
    const config = loadConfig();
    const notionService = new NotionService(config.notionApiKey);

    // Test 1: Check if we can query wardrobe database
    logger.info('Test 1: Querying Wardrobe database...');
    const wardrobeItems = await notionService.getActiveWardrobeItems();
    logger.info(`✓ Found ${wardrobeItems.length} active wardrobe items`);

    // Test 2: Check style inspo
    logger.info('Test 2: Querying Style Inspo database...');
    const styleInspo = await notionService.getLikedStyleInspo();
    logger.info(`✓ Found ${styleInspo.length} liked style inspiration items`);

    // Test 3: Check outfit requests
    logger.info('Test 3: Querying Outfit Requests database...');
    const pendingRequests = await notionService.getPendingOutfitRequests();
    logger.info(`✓ Found ${pendingRequests.length} pending outfit requests`);

    // Test 4: Check recent feedback
    logger.info('Test 4: Querying Worn Today database...');
    const recentFeedback = await notionService.getRecentWornFeedback(30);
    logger.info(`✓ Found ${recentFeedback.length} recent feedback entries`);

    logger.info('\n✅ All tests passed! Your Notion setup is working correctly.');
    logger.info('\nNext steps:');
    logger.info('1. Add wardrobe items to the Wardrobe database');
    logger.info('2. Add style inspiration to the Style Inspo database');
    logger.info('3. Create an outfit request via the web UI or directly in Notion');
    logger.info('4. Watch the outfits appear in the My Outfits database!');

  } catch (error) {
    logger.error('❌ Setup test failed', error);
    logger.error('\nCommon issues:');
    logger.error('- Check that all environment variables are set correctly');
    logger.error('- Verify database IDs are correct (32 characters with dashes)');
    logger.error('- Ensure Notion integration is connected to all 5 databases');
    logger.error('- Check that database property names match the schema exactly');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  testSetup().catch(console.error);
}

export { testSetup };
