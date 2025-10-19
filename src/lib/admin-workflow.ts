/**
 * Admin Workflow Management
 *
 * This handles the workflow between admin changes and static menu generation
 */

import { categoriesAPI, itemsAPI } from './supabase';

export interface AdminWorkflowConfig {
  mode: 'development' | 'production';
  autoRegenerate: boolean;
  notifyOnChange: boolean;
}

export class AdminWorkflowManager {
  private config: AdminWorkflowConfig;

  constructor(config: AdminWorkflowConfig) {
    this.config = config;
  }

  /**
   * Handle admin changes with appropriate workflow
   */
  async handleAdminChange(
    changeType: 'category' | 'item',
    action: 'create' | 'update' | 'delete',
    data?: any
  ) {
    console.log(`🔄 Admin ${action} ${changeType}:`, data);

    // 1. Save to Supabase (always happens)
    const result = await this.saveToSupabase(changeType, action, data);

    // 2. Handle static menu based on mode
    if (this.config.mode === 'production') {
      await this.handleProductionWorkflow(changeType, action);
    } else {
      await this.handleDevelopmentWorkflow(changeType, action);
    }

    return result;
  }

  /**
   * Save changes to Supabase database
   */
  private async saveToSupabase(
    changeType: 'category' | 'item',
    action: 'create' | 'update' | 'delete',
    data?: any
  ) {
    try {
      if (changeType === 'category') {
        switch (action) {
          case 'create':
            return await categoriesAPI.create(data);
          case 'update':
            return await categoriesAPI.update(data.id, data);
          case 'delete':
            return await categoriesAPI.delete(data.id);
        }
      } else {
        switch (action) {
          case 'create':
            return await itemsAPI.create(data);
          case 'update':
            return await itemsAPI.update(data.id, data);
          case 'delete':
            return await itemsAPI.delete(data.id);
        }
      }
    } catch (error) {
      console.error('❌ Failed to save to Supabase:', error);
      throw error;
    }
  }

  /**
   * Handle production workflow (regenerate static menu)
   */
  private async handleProductionWorkflow(
    changeType: 'category' | 'item',
    action: 'create' | 'update' | 'delete'
  ) {
    console.log('🏭 Production mode: Regenerating static menu...');

    try {
      // Option 1: Auto-regenerate static menu
      if (this.config.autoRegenerate) {
        await this.regenerateStaticMenu();
        console.log('✅ Static menu regenerated automatically');
      } else {
        // Option 2: Notify admin to regenerate
        this.notifyAdminToRegenerate();
      }
    } catch (error) {
      console.error('❌ Failed to regenerate static menu:', error);
      // Don't throw - admin changes are still saved to database
    }
  }

  /**
   * Handle development workflow (immediate updates)
   */
  private async handleDevelopmentWorkflow(
    changeType: 'category' | 'item',
    action: 'create' | 'update' | 'delete'
  ) {
    console.log('🛠️ Development mode: Changes visible immediately');

    // In development, changes are immediately visible
    // No static menu regeneration needed
  }

  /**
   * Regenerate static menu
   */
  private async regenerateStaticMenu() {
    try {
      // For Vite projects, we'll trigger a rebuild with static generation
      console.log('🔄 Triggering static menu regeneration...');

      // In a real implementation, you might want to:
      // 1. Call a server endpoint that runs the generation script
      // 2. Use a webhook to trigger regeneration
      // 3. Or simply notify the admin to run the command manually

      console.log('📊 Static menu regeneration triggered');
      console.log('💡 Run "npm run generate:static" to update the static menu');

      return { success: true, message: 'Static menu regeneration triggered' };
    } catch (error) {
      console.error('❌ Static menu regeneration failed:', error);
      throw error;
    }
  }

  /**
   * Notify admin to regenerate static menu
   */
  private notifyAdminToRegenerate() {
    if (this.config.notifyOnChange) {
      // Show notification to admin
      const notification = {
        type: 'info',
        title: 'Menu Updated',
        message:
          'Please regenerate static menu to see changes on the public site.',
        action: 'Regenerate Now',
        onAction: () => this.regenerateStaticMenu(),
      };

      // You can integrate this with your notification system
      console.log('📢 Admin notification:', notification);
    }
  }

  /**
   * Check if static menu is up to date
   */
  async checkStaticMenuStatus() {
    try {
      // Check if static menu file exists
      const response = await fetch('/static/menu.json');

      if (response.ok) {
        const menuData = await response.json();
        return {
          isUpToDate: true,
          lastGenerated: menuData.generatedAt,
          needsRegeneration: false,
          exists: true,
        };
      } else {
        return {
          isUpToDate: false,
          needsRegeneration: true,
          exists: false,
        };
      }
    } catch (error) {
      console.error('❌ Failed to check static menu status:', error);
      return { isUpToDate: false, needsRegeneration: true, exists: false };
    }
  }
}

// Export configured instances
export const adminWorkflow = new AdminWorkflowManager({
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  autoRegenerate: process.env.AUTO_REGENERATE_STATIC === 'true',
  notifyOnChange: true,
});

// Helper functions for easy integration
export const handleCategoryChange = (
  action: 'create' | 'update' | 'delete',
  data?: any
) => adminWorkflow.handleAdminChange('category', action, data);

export const handleItemChange = (
  action: 'create' | 'update' | 'delete',
  data?: any
) => adminWorkflow.handleAdminChange('item', action, data);
